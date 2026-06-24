import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Self-service account management for the signed-in user (any role).
// Separate from /api/admin/users, which is staff-only. Every operation here
// acts ONLY on the caller's own account — userId is never taken from the body.

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key === 'your_service_role_key_here') return null;
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

// PATCH — update the caller's own email and/or phone.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  const { email, phone } = await request.json();

  if (email && email !== user.email) {
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const updates: Record<string, string | null> = {};
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone || null;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('profiles').update(updates).eq('id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — delete the caller's own account, but only when they have no open commerce.
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });

  // Server-side guard: block deletion while listings or orders are still in flight.
  const { count: activeListings } = await admin
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .in('status', ['active', 'pending_review']);

  const { count: openOrders } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', user.id)
    .in('order_status', ['pending', 'confirmed', 'disputed']);

  if ((activeListings ?? 0) > 0 || (openOrders ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete an account with active deals' }, { status: 409 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
