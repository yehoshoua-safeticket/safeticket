// Staff authenticate by username, so the email on their auth record exists only to
// identify the account to Supabase — nothing is ever delivered to it. Deriving it
// from the username instead of using a real inbox means there is no address a staff
// member could type into the public login form, which is what actually keeps the two
// doors apart.
export const STAFF_EMAIL_DOMAIN = process.env.STAFF_EMAIL_DOMAIN || 'staff.safeticket.co.il';

export function staffEmail(username: string) {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}

export function isStaffEmail(email: string) {
  return email.toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`);
}
