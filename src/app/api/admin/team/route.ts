import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key === 'your_service_role_key_here') return null;
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'internal_user'].includes(profile.role)) return null;
  return user;
}

// POST /api/admin/team — create a new team member
export async function POST(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { name, email, password } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 });
  }

  const { data: { user: newUser }, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (authError || !newUser) {
    return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 });
  }

  // Upsert profile — if a DB trigger created one already (with wrong role), UPDATE it
  const { error: upsertError } = await admin.from('profiles').upsert(
    { id: newUser.id, email, full_name: name, role: 'internal_user', verification_status: 'verified' },
    { onConflict: 'id' }
  );

  if (upsertError) {
    // Fallback: try a plain UPDATE in case a trigger blocked the upsert path
    const { error: updateError } = await admin
      .from('profiles')
      .update({ email, full_name: name, role: 'internal_user', verification_status: 'verified' })
      .eq('id', newUser.id);

    if (updateError) {
      await admin.auth.admin.deleteUser(newUser.id);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: newUser.id, email, full_name: name });
}

// DELETE /api/admin/team — delete a team member by user ID
export async function DELETE(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  if (userId === caller.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
