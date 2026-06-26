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

// Fields the admin edit form is allowed to update on a single event.
const EDITABLE_FIELDS = ['title', 'venue', 'city', 'event_date', 'category', 'image_url'] as const;
const VALID_CATEGORIES = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];

// PATCH — two shapes, both via the service-role client (events has no UPDATE RLS policy):
//   1. { eventIds, status }       → bulk approve/reject (validation queue).
//   2. { eventId, fields:{...} }  → edit a single event (admin detail form).
export async function PATCH(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const body = await request.json();

  // Shape 2: single-event field edit.
  if (body.eventId && body.fields && typeof body.fields === 'object') {
    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body.fields) updates[key] = body.fields[key];
    }
    if ('category' in updates && !VALID_CATEGORIES.includes(updates.category as string)) {
      updates.category = 'other';
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    }
    const { error } = await admin.from('events').update(updates).eq('id', body.eventId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Shape 1: bulk status change.
  const { eventIds, status } = body;
  const ids: string[] = Array.isArray(eventIds) ? eventIds : eventIds ? [eventIds] : [];
  if (ids.length === 0 || !['active', 'rejected', 'pending_review'].includes(status)) {
    return NextResponse.json({ error: 'eventIds and a valid status are required' }, { status: 400 });
  }

  const { error } = await admin.from('events').update({ status }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
