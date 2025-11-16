import { describe, it, expect } from 'vitest';
import { EEGEmotionMapper } from './EEGEmotionMapper';

function generateSine(freqHz: number, sampleRate: number, seconds: number, amplitude = 1) {
  const N = Math.floor(sampleRate * seconds);
  const samples = new Array<number>(N);
  for (let n = 0; n < N; n++) {
    samples[n] = amplitude * Math.sin((2 * Math.PI * freqHz * n) / sampleRate);
  }
  return samples;
}

function mixSignals(signals: number[][]) {
  const N = signals[0].length;
  const mix = new Array<number>(N).fill(0);
  for (const sig of signals) {
    for (let i = 0; i < N; i++) mix[i] += sig[i];
  }
  return mix;
}

describe('EEGEmotionMapper - DFT band power', () => {
  const mapper = new EEGEmotionMapper();
  const sampleRate = 256; // Hz

  it('detects higher beta power for a 15Hz signal', () => {
    const beta = generateSine(15, sampleRate, 2, 1);
    const bands = mapper.analyzeFrequencyBands(beta, sampleRate);
    expect(bands.beta).toBeGreaterThan(bands.alpha);
    expect(bands.beta).toBeGreaterThan(bands.theta);
  });

  it('detects alpha dominance for ~10Hz', () => {
    const alpha = generateSine(10, sampleRate, 2, 1);
    const bands = mapper.analyzeFrequencyBands(alpha, sampleRate);
    expect(bands.alpha).toBeGreaterThan(bands.beta);
    expect(bands.alpha).toBeGreaterThan(bands.theta);
  });

  it('maps mixed beta+gamma to focused or curious states', () => {
    const beta = generateSine(20, sampleRate, 2, 0.8);
    const gamma = generateSine(40, sampleRate, 2, 0.6);
    const mixed = mixSignals([beta, gamma]);
    const bands = mapper.analyzeFrequencyBands(mixed, sampleRate);
    const emotion = mapper.mapToEmotionalState(bands);
    expect(['FOCUSED_HIGH', 'CURIOUS_INTERESTED']).toContain(emotion.primary);
    expect(emotion.intensity).toBeGreaterThan(0);
    expect(emotion.confidence).toBeGreaterThan(0);
  });
});