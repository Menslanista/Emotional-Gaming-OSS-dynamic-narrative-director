import { describe, it, expect, vi } from 'vitest';
import { MuseConnector } from './MuseConnector';

describe('MuseConnector', () => {
  it('detects Web Bluetooth availability (likely false in test env)', () => {
    const available = MuseConnector.isAvailable();
    expect(typeof available).toBe('boolean');
    expect(available).toBe(false);
  });

  it('emits samples in mock mode', () => {
    vi.useFakeTimers();
    const connector = new MuseConnector({ enableMock: true, mockSampleRate: 50, mockChannels: 2 });
    const samples: any[] = [];
    connector.onSample((s) => samples.push(s));

    connector.startMockStream();
    vi.advanceTimersByTime(200); // ~10 samples at 50Hz
    connector.stopMockStream();

    expect(samples.length).toBeGreaterThan(0);
    expect(Array.isArray(samples[0].channels)).toBe(true);
    expect(samples[0].channels.length).toBe(2);
  });
});