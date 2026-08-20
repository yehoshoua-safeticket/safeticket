import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inDateRange, matchPreset, presetRange, toISODate } from '@/lib/filters';

// Every date below is built with the local-time Date constructor and asserted
// against local-time output, so these tests hold in any timezone rather than
// only in the one CI happens to run in.
function localNoon(y: number, m: number, d: number) {
  return new Date(y, m - 1, d, 12, 0, 0);
}

describe('toISODate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(toISODate(localNoon(2026, 8, 20))).toBe('2026-08-20');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toISODate(localNoon(2026, 1, 5))).toBe('2026-01-05');
  });
});

describe('presetRange', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('today is a single inclusive day', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    expect(presetRange('today')).toEqual({ from: '2026-08-20', to: '2026-08-20' });
  });

  it('week spans today plus six days', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    expect(presetRange('week')).toEqual({ from: '2026-08-20', to: '2026-08-26' });
  });

  it('month runs from today to the last day of the month', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    expect(presetRange('month')).toEqual({ from: '2026-08-20', to: '2026-08-31' });
  });

  it('month handles a short month', () => {
    vi.setSystemTime(localNoon(2026, 2, 5));
    expect(presetRange('month')).toEqual({ from: '2026-02-05', to: '2026-02-28' });
  });

  it('weekend is the coming Friday-Saturday', () => {
    vi.setSystemTime(localNoon(2026, 8, 20)); // Thursday
    expect(presetRange('weekend')).toEqual({ from: '2026-08-21', to: '2026-08-22' });
  });

  it('weekend includes today when today is Friday', () => {
    vi.setSystemTime(localNoon(2026, 8, 21)); // Friday
    expect(presetRange('weekend')).toEqual({ from: '2026-08-21', to: '2026-08-22' });
  });

  it('weekend rolls to next week once Saturday has started', () => {
    // Deliberate consequence of "the coming Friday": on Saturday the filter
    // stops offering the weekend the user is currently in.
    vi.setSystemTime(localNoon(2026, 8, 22)); // Saturday
    expect(presetRange('weekend')).toEqual({ from: '2026-08-28', to: '2026-08-29' });
  });
});

describe('matchPreset', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('recognises each preset from its own range', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    for (const preset of ['today', 'weekend', 'week', 'month'] as const) {
      const { from, to } = presetRange(preset);
      expect(matchPreset(from, to)).toBe(preset);
    }
  });

  it('returns null for a hand-picked range', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    expect(matchPreset('2026-09-03', '2026-09-09')).toBeNull();
  });

  it('returns null for an empty range', () => {
    vi.setSystemTime(localNoon(2026, 8, 20));
    expect(matchPreset('', '')).toBeNull();
  });
});

describe('inDateRange', () => {
  it('accepts a date inside the range', () => {
    expect(inDateRange('2026-08-20T12:00:00', '2026-08-01', '2026-08-31')).toBe(true);
  });

  it('is inclusive on both bounds', () => {
    expect(inDateRange('2026-08-01T12:00:00', '2026-08-01', '2026-08-31')).toBe(true);
    expect(inDateRange('2026-08-31T12:00:00', '2026-08-01', '2026-08-31')).toBe(true);
  });

  it('rejects a date before the range', () => {
    expect(inDateRange('2026-07-31T12:00:00', '2026-08-01', '2026-08-31')).toBe(false);
  });

  it('rejects a date after the range', () => {
    expect(inDateRange('2026-09-01T12:00:00', '2026-08-01', '2026-08-31')).toBe(false);
  });

  it('treats an empty bound as unbounded', () => {
    expect(inDateRange('2020-01-01T12:00:00', '', '2026-08-31')).toBe(true);
    expect(inDateRange('2099-01-01T12:00:00', '2026-08-01', '')).toBe(true);
    expect(inDateRange('2026-08-20T12:00:00', '', '')).toBe(true);
  });
});
