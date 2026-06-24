import { redirect } from 'next/navigation';

// Legacy route — the working sell flow lives under the dashboard.
export default function SellRedirect() {
  redirect('/dashboard/sell');
}
