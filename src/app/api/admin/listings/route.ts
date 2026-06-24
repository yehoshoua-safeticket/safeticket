import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const TICKETS_BUCKET = 'tickets';

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

// POST (multipart/form-data) — staff create a listing on behalf of a seller.
// listings RLS is seller-scoped, so the insert (with an arbitrary seller_id) runs
// via the service-role client.
export async function POST(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const form = await request.formData();
  const sellerId = form.get('seller_id') as string;
  const eventId = form.get('event_id') as string;
  const quantity = parseInt(form.get('quantity') as string, 10);
  const faceValue = parseFloat(form.get('face_value') as string);
  const askingPrice = parseFloat(form.get('asking_price') as string);
  const section = (form.get('section') as string) || null;
  const row = (form.get('row') as string) || null;
  const seatInfo = (form.get('seat_info') as string) || null;
  const statusRaw = (form.get('status') as string) || 'active';
  const status = ['active', 'pending_review', 'draft'].includes(statusRaw) ? statusRaw : 'active';
  const file = form.get('file');

  if (!sellerId || !eventId) return NextResponse.json({ error: 'seller_id and event_id are required' }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity < 1) return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
  if (!Number.isFinite(faceValue) || faceValue <= 0) return NextResponse.json({ error: 'Face value must be greater than zero' }, { status: 400 });
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return NextResponse.json({ error: 'Asking price must be greater than zero' }, { status: 400 });
  if (askingPrice > faceValue) return NextResponse.json({ error: 'Asking price cannot exceed the face value' }, { status: 400 });

  let ticketFileUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    await admin.storage.createBucket(TICKETS_BUCKET, { public: true }).catch(() => {});
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `listings/${sellerId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(TICKETS_BUCKET).upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { data: urlData } = admin.storage.from(TICKETS_BUCKET).getPublicUrl(path);
    ticketFileUrl = urlData.publicUrl;
  }

  const { data, error } = await admin.from('listings').insert({
    seller_id: sellerId,
    event_id: eventId,
    quantity,
    face_value: faceValue,
    asking_price: askingPrice,
    section,
    row,
    seat_info: seatInfo,
    ticket_file_url: ticketFileUrl,
    status,
    risk_status: 'clear',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
