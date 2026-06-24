import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Private bucket for sensitive identity documents (not publicly readable).
const BUCKET = 'verification-docs';
const VALID_DOC_TYPES = ['id', 'passport', 'license'];

// POST (multipart/form-data) — submit an identity-verification request.
// verifications has no INSERT RLS policy and ID docs must stay private, so the
// upload + row insert run through the service-role client server-side.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const form = await request.formData();
  const file = form.get('file');
  const docTypeRaw = (form.get('document_type') as string) || 'id';
  const documentType = VALID_DOC_TYPES.includes(docTypeRaw) ? docTypeRaw : 'id';

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A document file is required' }, { status: 400 });
  }

  // Ensure the private bucket exists (idempotent — ignore "already exists").
  await admin.storage.createBucket(BUCKET, { public: false }).catch(() => {});

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { error: insErr } = await admin.from('verifications').insert({
    user_id: user.id,
    document_type: documentType,
    document_url: path,
    status: 'pending',
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const { error: profErr } = await admin
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', user.id);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
