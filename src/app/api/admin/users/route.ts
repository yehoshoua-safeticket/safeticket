import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

function getAdminClient(): SupabaseClient | null {
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
  return { user, callerRole: profile.role as string };
}

// internal_user may only manage external_users; only admins may touch admins/internal_users.
// Returns an error response if the caller is not allowed to act on the target, else null.
async function guardTargetRole(
  admin: SupabaseClient,
  callerRole: string,
  targetId: string,
) {
  if (callerRole === 'admin') return null;
  const { data: target } = await admin.from('profiles').select('role').eq('id', targetId).single();
  if (target && target.role !== 'external_user') {
    return NextResponse.json({ error: 'Only admins can manage staff accounts' }, { status: 403 });
  }
  return null;
}

// POST — create a new external_user
export async function POST(request: NextRequest) {
  const callerInfo = await requireAdmin();
  if (!callerInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const caller = callerInfo.user;

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { email, password, full_name, phone } = await request.json();
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'email, password, and full_name are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError || !data.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
  }

  const { error: upsertError } = await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name,
    phone: phone || null,
    role: 'external_user',
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: data.user.id });
}

// PATCH — update profile fields and optionally auth email
export async function PATCH(request: NextRequest) {
  const callerInfo = await requireAdmin();
  if (!callerInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { userId, role, verification_status, full_name, email, phone } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  if (role && callerInfo.callerRole !== 'admin') {
    return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 });
  }

  const targetGuard = await guardTargetRole(admin, callerInfo.callerRole, userId);
  if (targetGuard) return targetGuard;

  // Sync email and/or full_name to auth.users
  if (email || full_name) {
    const authUpdates: Record<string, unknown> = {};
    if (email) { authUpdates.email = email; authUpdates.email_confirm = true; }
    if (full_name) authUpdates.user_metadata = { full_name };
    const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdates);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const updates: Record<string, string | null> = {};
  if (role) updates.role = role;
  if (verification_status) updates.verification_status = verification_status;
  if (full_name) updates.full_name = full_name;
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone || null;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('profiles').update(updates).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove from auth (cascades to profiles)
export async function DELETE(request: NextRequest) {
  const callerInfo = await requireAdmin();
  if (!callerInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const caller = callerInfo.user;

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  if (userId === caller.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const targetGuard = await guardTargetRole(admin, callerInfo.callerRole, userId);
  if (targetGuard) return targetGuard;

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
