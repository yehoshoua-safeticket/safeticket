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

// Whitelisted so a client cannot write id / created_at or invent columns.
const EDITABLE_FIELDS = [
  'question_he', 'answer_he',
  'question_en', 'answer_en',
  'asterisk_he', 'asterisk_en',
  'keywords', 'category', 'position', 'published',
] as const;

const CATEGORIES = ['general', 'buyers', 'sellers', 'security'];

/** Keep only known fields, and coerce each to the column's shape. */
function pickFields(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (key === 'position') out[key] = Number(value) || 0;
    else if (key === 'published') out[key] = !!value;
    else if (key === 'category') out[key] = CATEGORIES.includes(String(value)) ? value : null;
    else out[key] = String(value ?? '');
  }
  return out;
}

// GET — every FAQ (including unpublished), in display order.
// A missing faqs table (pre-migration) yields an empty list, not a 500.
export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { data, error } = await admin.from('faqs').select('*').order('position', { ascending: true });
  if (error) return NextResponse.json({ faqs: [], migrated: false });
  return NextResponse.json({ faqs: data ?? [], migrated: true });
}

// POST — create one FAQ. Body: { fields: {...} }
export async function POST(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const fields = pickFields(body.fields ?? {});

  if (!String(fields.question_he ?? '').trim() || !String(fields.answer_he ?? '').trim()) {
    return NextResponse.json({ error: 'question_he and answer_he are required' }, { status: 400 });
  }

  // New rows land at the end unless a position was given.
  if (!('position' in fields)) {
    const { data: last } = await admin.from('faqs').select('position').order('position', { ascending: false }).limit(1);
    fields.position = ((last?.[0]?.position as number | undefined) ?? -1) + 1;
  }

  const { data, error } = await admin.from('faqs').insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faq: data });
}

// PATCH — update one FAQ, or reorder many.
// Body: { id, fields: {...} }  |  { order: [id, id, ...] }
export async function PATCH(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));

  // Reorder: the array index becomes the new position.
  if (Array.isArray(body.order)) {
    for (const [index, id] of (body.order as string[]).entries()) {
      const { error } = await admin.from('faqs').update({ position: index, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (!body.id || typeof body.fields !== 'object' || body.fields === null) {
    return NextResponse.json({ error: 'id and fields are required' }, { status: 400 });
  }

  const fields = pickFields(body.fields);
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }
  fields.updated_at = new Date().toISOString();

  const { error } = await admin.from('faqs').update(fields).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove one FAQ. Body: { id }
export async function DELETE(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await admin.from('faqs').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
