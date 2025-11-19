/**
 * The different frequency bands of EEG data.
 */
export type FrequencyBand = "delta" | "theta" | "alpha" | "beta" | "gamma";

/**
 * An interface representing the power of each EEG frequency band.
 * @property {number} delta - The power of the delta band.
 * @property {number} theta - The power of the theta band.
 * @property {number} alpha - The power of the alpha band.
 * @property {number} beta - The power of the beta band.
 * @property {number} gamma - The power of the gamma band.
 */
export interface FrequencyBands {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

/**
 * An interface representing the emotional state of the user.
 * @property {"FOCUSED_HIGH" | "RELAXED_CALM" | "ANXIOUS_STRESSED" | "CURIOUS_INTERESTED"} primary - The primary emotion.
 * @property {number} intensity - The intensity of the emotion, from 0 to 1.
 * @property {number} confidence - The confidence of the emotion detection, from 0 to 1.
 */
export interface EmotionState {
  primary: "FOCUSED_HIGH" | "RELAXED_CALM" | "ANXIOUS_STRESSED" | "CURIOUS_INTERESTED";
  intensity: number; // 0-1
  confidence: number; // 0-1
}

const BAND_RANGES: Record<FrequencyBand, [number, number]> = {
  delta: [0.5, 4],
  theta: [4, 8],
  alpha: [8, 13],
  beta: [13, 30],
  gamma: [30, 100],
};

/**
 * A class for mapping EEG data to emotional states.
 */
export class EEGEmotionMapper {
  /**
   * Analyzes the frequency bands of a set of EEG samples.
   * @param {number[]} eegSamples - The EEG samples to analyze.
   * @param {number} sampleRate - The sample rate of the EEG data.
   * @returns {FrequencyBands} The power of each frequency band.
   */
  analyzeFrequencyBands(eegSamples: number[], sampleRate: number): FrequencyBands {
    const bands: Partial<FrequencyBands> = {};
    (Object.keys(BAND_RANGES) as FrequencyBand[]).forEach((band) => {
      const [low, high] = BAND_RANGES[band];
      bands[band] = this.calculateBandPower(eegSamples, sampleRate, low, high);
    });
    return bands as FrequencyBands;
  }

  /**
   * Maps a set of frequency bands to an emotional state.
   * @param {FrequencyBands} bands - The frequency bands to map.
   * @returns {EmotionState} The emotional state.
   */
  mapToEmotionalState(bands: FrequencyBands): EmotionState {
    const total = bands.delta + bands.theta + bands.alpha + bands.beta + bands.gamma || 1;
    const r = {
      delta: bands.delta / total,
      theta: bands.theta / total,
      alpha: bands.alpha / total,
      beta: bands.beta / total,
      gamma: bands.gamma / total,
    };

    // Rule-based preference for mixed beta+gamma
    if (r.beta + r.gamma > 0.6) {
      if (r.gamma > 0.55 && r.alpha < 0.2) {
        // Strong gamma dominance with low alpha: stress/anxiety
        const intensity = Math.min(1, r.gamma + 0.5 * r.beta);
        const confidence = Math.min(1, (r.gamma + r.beta) / (r.alpha + r.theta + 1e-6));
        return { primary: 'ANXIOUS_STRESSED', intensity, confidence };
      }
      if (r.beta >= r.gamma) {
        // Focused when beta is at least as strong as gamma
        const intensity = Math.min(1, r.beta + 0.3 * r.gamma);
        const confidence = Math.min(1, (r.beta + r.gamma) / (r.alpha + r.theta + 1e-6));
        return { primary: 'FOCUSED_HIGH', intensity, confidence };
      }
      // Curious when gamma edges beta but alpha is present
      const intensity = Math.min(1, r.gamma + 0.3 * r.alpha);
      const confidence = Math.min(1, (r.gamma + r.alpha) / (r.beta + r.theta + 1e-6));
      return { primary: 'CURIOUS_INTERESTED', intensity, confidence };
    }

    // Weighted scoring fallback
    const focusedScore = bands.beta * 0.5 + bands.alpha * 0.2 + bands.gamma * 0.3;
    const relaxedScore = bands.alpha * 0.6 + bands.theta * 0.3 - bands.beta * 0.2;
    const anxiousScore = bands.beta * 0.6 - bands.alpha * 0.3 + bands.gamma * 0.2;
    const curiousScore = bands.gamma * 0.5 + bands.alpha * 0.3 + bands.theta * 0.2;

    const scores = [focusedScore, relaxedScore, anxiousScore, curiousScore];
    const max = Math.max(...scores);
    const sum = scores.reduce((a, b) => a + b, 0) || 1;
    const confidence = Math.min(1, max / sum);

    const labels: EmotionState['primary'][] = [
      'FOCUSED_HIGH',
      'RELAXED_CALM',
      'ANXIOUS_STRESSED',
      'CURIOUS_INTERESTED',
    ];

    const primary = labels[scores.indexOf(max)];
    const intensity = Math.min(1, max);

    return { primary, intensity, confidence };
  }

  // FFT-like band power using naive DFT over the target frequency bins.
  private calculateBandPower(
    samples: number[],
    sampleRate: number,
    lowHz: number,
    highHz: number
  ): number {
    const N = samples.length;
    if (N === 0 || sampleRate <= 0 || highHz <= lowHz) return 0;

    // Hann window to reduce spectral leakage
    const windowed = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      windowed[n] = samples[n] * w;
    }

    const fPerBin = sampleRate / N;
    const kStart = Math.max(1, Math.floor(lowHz / fPerBin));
    const kEnd = Math.min(Math.floor(highHz / fPerBin), Math.floor(N / 2));
    if (kEnd <= kStart) return 0;

    let powerSum = 0;
    let binCount = 0;

    for (let k = kStart; k <= kEnd; k++) {
      let re = 0;
      let im = 0;
      const twoPiKOverN = (2 * Math.PI * k) / N;
      for (let n = 0; n < N; n++) {
        const angle = twoPiKOverN * n;
        re += windowed[n] * Math.cos(angle);
        im -= windowed[n] * Math.sin(angle);
      }
      const mag2 = (re * re + im * im) / (N * N); // normalize by N
      powerSum += mag2;
      binCount++;
    }

    // Average power in the band, normalize by count
    const avgPower = powerSum / Math.max(1, binCount);

    // Simple dynamic range compression for stability
    return Math.sqrt(avgPower);
  }
}