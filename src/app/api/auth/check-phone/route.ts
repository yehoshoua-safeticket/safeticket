import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// profiles SELECT is restricted to own-row/admin by RLS, so signup (unauthenticated)
// needs a service-role lookup to check for an existing phone number before creating an account.
export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ taken: false });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', phone.trim())
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ taken: !!data });
}
