import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST — open a dispute on one of the caller's own orders.
// disputes has no INSERT RLS policy, so the validated insert runs via service role.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, reason } = await request.json();
  if (!orderId || !reason || !String(reason).trim()) {
    return NextResponse.json({ error: 'orderId and reason are required' }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  // The order must exist and belong to the caller.
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, buyer_id')
    .eq('id', orderId)
    .single();
  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'You can only open disputes on your own orders' }, { status: 403 });
  }

  // One open dispute per order.
  const { count: existing } = await admin
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .in('status', ['open', 'under_review']);
  if ((existing ?? 0) > 0) {
    return NextResponse.json({ error: 'A dispute is already open for this order' }, { status: 409 });
  }

  const { error: insErr } = await admin.from('disputes').insert({
    order_id: orderId,
    opened_by: user.id,
    reason: String(reason).slice(0, 2000),
    status: 'open',
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Flag the order as disputed.
  await admin.from('orders').update({ order_status: 'disputed' }).eq('id', orderId);

  return NextResponse.json({ success: true });
}
