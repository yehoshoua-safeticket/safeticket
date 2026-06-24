import { createClient } from './supabase-server';
import { cookies } from 'next/headers';

const SUPABASE_AVAILABLE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');
const DEV_MODE = !SUPABASE_AVAILABLE;

const ADMIN_ROLES = ['admin', 'internal_user'] as const;

export async function requireAdmin() {
  if (DEV_MODE) {
    const cookieStore = await cookies();
    const devUser = cookieStore.get('dev_user')?.value;

    if (!devUser) {
      return { authorized: false, error: 'Not authenticated' };
    }

    const user = JSON.parse(devUser);
    if (!ADMIN_ROLES.includes(user.role)) {
      return { authorized: false, error: 'Not authorized' };
    }

    return { authorized: true, user, profile: { role: user.role } };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { authorized: false, error: 'Not authorized' };
  }

  return { authorized: true, user, profile };
}

export async function isAdmin() {
  if (DEV_MODE) {
    const cookieStore = await cookies();
    const devUser = cookieStore.get('dev_user')?.value;
    if (!devUser) return false;
    const user = JSON.parse(devUser);
    return ADMIN_ROLES.includes(user.role);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return ADMIN_ROLES.includes(profile?.role as typeof ADMIN_ROLES[number]);
}
