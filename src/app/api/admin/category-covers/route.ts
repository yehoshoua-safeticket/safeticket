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

const CATEGORIES = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

// GET — all category→cover-event rows, joined to events.
// A missing category_covers table (pre-migration) yields an empty list, not a 500.
export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { data, error } = await admin
    .from('category_covers')
    .select('category, event_id, updated_at, event:events(*)');

  if (error) {
    return NextResponse.json({ covers: [], migrated: false });
  }
  return NextResponse.json({ covers: data ?? [], migrated: true });
}

// PUT — set/clear the cover for one or more categories.
// Body: { covers: { [category]: event_id | null } }. null/empty clears that category.
export async function PUT(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const covers = body.covers;
  if (!covers || typeof covers !== 'object') {
    return NextResponse.json({ error: 'covers object is required' }, { status: 400 });
  }

  const toUpsert: { category: string; event_id: string; updated_at: string }[] = [];
  const toClear: string[] = [];
  const now = new Date().toISOString();

  for (const category of CATEGORIES) {
    if (!(category in covers)) continue; // only touch categories the client sent
    const eventId = covers[category];
    if (eventId) toUpsert.push({ category, event_id: eventId, updated_at: now });
    else toClear.push(category);
  }

  if (toClear.length > 0) {
    const { error: delErr } = await admin.from('category_covers').delete().in('category', toClear);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }
  if (toUpsert.length > 0) {
    const { error: upErr } = await admin.from('category_covers').upsert(toUpsert, { onConflict: 'category' });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
