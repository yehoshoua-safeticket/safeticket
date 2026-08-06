import { redirect } from 'next/navigation';

// Legacy route — the working sell flow lives inside the account area.
export default function SellRedirect() {
  redirect('/account/sell');
}
