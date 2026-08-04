import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const STAFF_ROLES = ['admin', 'internal_user'];

// POST { username, password } — resolve a staff username to its account and open a
// session. The username -> email mapping never reaches the client, and every
// failure returns the same response so this can't be used to enumerate accounts.
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const { username, password } = await request.json();
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 400 });
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('email, role')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password });
  if (error) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
