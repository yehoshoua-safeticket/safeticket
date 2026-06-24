import { redirect } from 'next/navigation';

// Legacy route — the working identity-verification flow lives under the dashboard.
export default function VerifyRedirect() {
  redirect('/dashboard/verify');
}
