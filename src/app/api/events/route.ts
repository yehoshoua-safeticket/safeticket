import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, venue, city, event_date, category } = body;

  if (!title || !venue || !city || !event_date || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validCategories = ['concert', 'sports', 'theater', 'festival', 'conference', 'other'];
  const safeCategory = validCategories.includes(category) ? category : 'other';

  // The events table has RLS enabled with no INSERT policy, so the user-session
  // client cannot insert. Sellers are allowed to create events as part of the
  // sell flow, so perform the validated insert with the service-role client.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  // Staff-created events are auto-approved; seller-created ones await admin validation.
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const isStaff = profile && ['admin', 'internal_user'].includes(profile.role);

  const { data, error } = await admin
    .from('events')
    .insert({ title, venue, city, event_date, category: safeCategory })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark seller-created events as pending_review. Wrapped so it degrades gracefully
  // if the add-event-status migration hasn't been applied yet (column missing).
  if (!isStaff && data?.id) {
    await admin.from('events').update({ status: 'pending_review' }).eq('id', data.id);
  }

  return NextResponse.json({ event: data });
}
