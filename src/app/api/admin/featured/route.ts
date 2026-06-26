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

const MAX_FEATURED = 5;

// GET — current featured set, joined to events, ordered by position.
// A missing featured_events table (pre-migration) yields an empty list, not a 500.
export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { data, error } = await admin
    .from('featured_events')
    .select('event_id, position, created_at, event:events(*)')
    .order('position', { ascending: true });

  if (error) {
    // Table not created yet → behave as empty so the admin page still loads.
    return NextResponse.json({ featured: [], migrated: false });
  }
  return NextResponse.json({ featured: data ?? [], migrated: true });
}

// PUT — replace the entire featured set with the provided ordered list.
// Body: { items: [{ event_id }] } — order in the array defines position (0..n).
export async function PUT(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const rawItems: unknown = body.items;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 });
  }

  // Normalize: keep unique event_ids in order, cap at MAX_FEATURED.
  const seen = new Set<string>();
  const rows: { event_id: string; position: number }[] = [];
  for (const it of rawItems) {
    const id = typeof it === 'string' ? it : (it && typeof it === 'object' ? (it as { event_id?: string }).event_id : undefined);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({ event_id: id, position: rows.length });
    if (rows.length >= MAX_FEATURED) break;
  }

  // Replace the set: clear all, then insert the new ordered rows.
  const { error: delErr } = await admin.from('featured_events').delete().neq('event_id', '00000000-0000-0000-0000-000000000000');
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (rows.length > 0) {
    const { error: insErr } = await admin.from('featured_events').insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: rows.length });
}
