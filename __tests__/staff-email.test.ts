import { describe, expect, it } from 'vitest';
import { STAFF_EMAIL_DOMAIN, isStaffEmail, staffEmail } from '@/lib/staff-email';

// These two helpers carry the staff/customer separation: a staff credential must
// never be typeable into the public login form. The round-trip and the
// "customer address is never staff" case are the properties that actually matter.
describe('staffEmail', () => {
  it('derives a lowercased address from the username', () => {
    expect(staffEmail('Yossi')).toBe(`yossi@${STAFF_EMAIL_DOMAIN}`);
  });

  it('trims surrounding whitespace before deriving', () => {
    expect(staffEmail('  Yossi  ')).toBe(`yossi@${STAFF_EMAIL_DOMAIN}`);
  });

  it('leaves an already-normalised username untouched', () => {
    expect(staffEmail('yossi')).toBe(`yossi@${STAFF_EMAIL_DOMAIN}`);
  });

  it('falls back to the staff domain when STAFF_EMAIL_DOMAIN is unset', () => {
    // Neither local dev nor CI sets the variable; this pins the default that
    // production relies on if the env var is ever dropped.
    expect(STAFF_EMAIL_DOMAIN).toBe('staff.safeticket.co.il');
  });
});

describe('isStaffEmail', () => {
  it('recognises a derived staff address', () => {
    expect(isStaffEmail(`yossi@${STAFF_EMAIL_DOMAIN}`)).toBe(true);
  });

  it('ignores case', () => {
    expect(isStaffEmail(`YOSSI@${STAFF_EMAIL_DOMAIN.toUpperCase()}`)).toBe(true);
  });

  it('rejects a real customer address', () => {
    expect(isStaffEmail('someone@gmail.com')).toBe(false);
  });

  it('rejects an address that merely contains the domain', () => {
    expect(isStaffEmail(`${STAFF_EMAIL_DOMAIN}@gmail.com`)).toBe(false);
  });

  it('round-trips every username it derives', () => {
    for (const name of ['yossi', 'Dana', ' avi ', 'support-2']) {
      expect(isStaffEmail(staffEmail(name))).toBe(true);
    }
  });
});
