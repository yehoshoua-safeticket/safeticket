import { redirect } from 'next/navigation';

// Legacy route — the working identity-verification flow lives inside the account area.
export default function VerifyRedirect() {
  redirect('/account/verify');
}
