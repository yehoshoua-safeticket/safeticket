import { redirect } from 'next/navigation';

// Legacy route — account settings now live inside the account area, which is
// where the gate and the sidebar are.
export default function SettingsRedirect() {
  redirect('/account/settings');
}
