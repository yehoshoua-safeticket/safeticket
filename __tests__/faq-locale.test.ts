import { describe, expect, it } from 'vitest';
import { localizeFaq } from '@/lib/faq-locale';
import type { Faq } from '@/types/database';

function faq(overrides: Partial<Faq> = {}): Faq {
  return {
    id: 'faq-1',
    question_he: 'שאלה',
    answer_he: 'תשובה',
    question_en: 'Question',
    answer_en: 'Answer',
    asterisk_he: 'הערה',
    asterisk_en: 'Note',
    keywords: 'escrow refund',
    category: 'general',
    position: 1,
    published: true,
    created_at: '2026-07-21T00:00:00Z',
    updated_at: '2026-07-21T00:00:00Z',
    ...overrides,
  };
}

describe('localizeFaq', () => {
  it('returns the English fields for the en locale', () => {
    expect(localizeFaq(faq(), 'en')).toEqual({
      id: 'faq-1',
      question: 'Question',
      answer: 'Answer',
      asterisk: 'Note',
      keywords: 'escrow refund',
    });
  });

  it('returns Hebrew for any other locale', () => {
    expect(localizeFaq(faq(), 'he')).toMatchObject({
      question: 'שאלה',
      answer: 'תשובה',
      asterisk: 'הערה',
    });
  });

  it('keeps Hebrew even when English is present, for the he locale', () => {
    expect(localizeFaq(faq(), 'he').question).toBe('שאלה');
  });

  it('falls back to Hebrew when an English field is empty', () => {
    expect(localizeFaq(faq({ question_en: '' }), 'en').question).toBe('שאלה');
  });

  it('falls back to Hebrew when an English field is only whitespace', () => {
    expect(localizeFaq(faq({ answer_en: '   ' }), 'en').answer).toBe('תשובה');
  });

  it('falls back per field, not all-or-nothing', () => {
    const result = localizeFaq(faq({ asterisk_en: '' }), 'en');
    expect(result.question).toBe('Question');
    expect(result.asterisk).toBe('הערה');
  });

  it('trims the English value it returns', () => {
    expect(localizeFaq(faq({ question_en: '  Question  ' }), 'en').question).toBe('Question');
  });

  it('passes keywords through untouched in both locales', () => {
    expect(localizeFaq(faq(), 'en').keywords).toBe('escrow refund');
    expect(localizeFaq(faq(), 'he').keywords).toBe('escrow refund');
  });
});
