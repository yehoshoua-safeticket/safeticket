import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'internal_user'].includes(profile.role)) return null;
  return { user, role: profile.role as string };
}

function getAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key === 'your_service_role_key_here') return null;
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

// PATCH — validate (approve) or reject one or more events. The events table has no
// UPDATE RLS policy, so status changes go through the service-role client.
export async function PATCH(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { eventIds, status } = await request.json();
  const ids: string[] = Array.isArray(eventIds) ? eventIds : eventIds ? [eventIds] : [];
  if (ids.length === 0 || !['active', 'rejected', 'pending_review'].includes(status)) {
    return NextResponse.json({ error: 'eventIds and a valid status are required' }, { status: 400 });
  }

  const { error } = await admin.from('events').update({ status }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
