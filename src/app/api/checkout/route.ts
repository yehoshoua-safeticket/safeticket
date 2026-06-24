import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const SERVICE_FEE_RATE = 0.10;

// POST — complete a purchase: create an order, mark the listing sold, open a held payout.
// The orders/payouts tables have no INSERT RLS policy, so the write goes through the
// service-role client after the caller is authenticated and the listing is validated.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  // Load the listing and validate it can be purchased.
  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('id, seller_id, quantity, asking_price, status')
    .eq('id', listingId)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'This ticket is no longer available' }, { status: 409 });
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 });
  }

  const subtotal = Number(listing.asking_price) * listing.quantity;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  // Atomically claim the listing (guard on status to prevent double-sell).
  const { data: claimed, error: claimErr } = await admin
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)
    .eq('status', 'active')
    .select('id')
    .maybeSingle();

  if (claimErr) {
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ error: 'This ticket is no longer available' }, { status: 409 });
  }

  // Create the order (escrow: money held until after the event).
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      buyer_id: user.id,
      listing_id: listingId,
      total_amount: total,
      payment_status: 'held',
      order_status: 'confirmed',
      payout_status: 'held',
    })
    .select('id, created_at')
    .single();

  if (orderErr || !order) {
    // Roll back the listing claim so the ticket can be bought again.
    await admin.from('listings').update({ status: 'active' }).eq('id', listingId);
    return NextResponse.json({ error: orderErr?.message || 'Failed to create order' }, { status: 500 });
  }

  // Open a held payout for the seller (their asking price; platform keeps the fee).
  await admin.from('payouts').insert({
    order_id: order.id,
    seller_id: listing.seller_id,
    amount: subtotal,
    status: 'held',
  });

  return NextResponse.json({ orderId: order.id, total, createdAt: order.created_at });
}
