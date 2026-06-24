import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const BUCKET = 'verification-docs';

// Staff (admin or internal_user) may review verifications. Returns the caller's
// role, or null if not staff.
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

// GET — list verification requests (newest first) with the submitter's profile and
// a short-lived signed URL for the private document. Optional ?id= for a single one.
export async function GET(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const id = request.nextUrl.searchParams.get('id');
  let query = admin
    .from('verifications')
    .select('id, user_id, document_type, document_url, status, reviewed_at, created_at, user:profiles(id, full_name, email, verification_status)')
    .order('created_at', { ascending: false });
  if (id) query = query.eq('id', id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = await Promise.all((data || []).map(async (v) => {
    let signedUrl: string | null = null;
    if (v.document_url) {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(v.document_url, 3600);
      signedUrl = signed?.signedUrl ?? null;
    }
    return { ...v, signedUrl };
  }));

  return NextResponse.json({ verifications: rows });
}

// PATCH — approve or reject one (or several) verification requests.
export async function PATCH(request: NextRequest) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { verificationIds, status } = await request.json();
  const ids: string[] = Array.isArray(verificationIds) ? verificationIds : verificationIds ? [verificationIds] : [];
  if (ids.length === 0 || !['verified', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'verificationIds and a valid status are required' }, { status: 400 });
  }

  const reviewedAt = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('verifications')
    .update({ status, reviewed_at: reviewedAt })
    .in('id', ids)
    .select('user_id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync each submitter's profile verification status.
  const userIds = [...new Set((updated || []).map((u) => u.user_id))];
  if (userIds.length > 0) {
    const { error: pe } = await admin.from('profiles').update({ verification_status: status }).in('id', userIds);
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
