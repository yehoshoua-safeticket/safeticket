import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPABASE_AVAILABLE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');
const DEV_MODE = !SUPABASE_AVAILABLE;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (DEV_MODE) {
      // Development mode: update dev cookie
      const cookieStore = await cookies();
      const devUser = cookieStore.get('dev_user')?.value;

      if (!devUser) {
        return NextResponse.json(
          { error: 'User not found. Sign up first at /auth/signup' },
          { status: 404 }
        );
      }

      const user = JSON.parse(devUser);
      if (user.email !== email) {
        return NextResponse.json(
          { error: 'Email does not match current user' },
          { status: 400 }
        );
      }

      user.role = 'admin';
      cookieStore.set('dev_user', JSON.stringify(user), {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: `${email} is now an admin (dev mode)`,
      });
    }

    const supabase = await createClient();

    // Get the currently authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated. Log in first at /auth/login' },
        { status: 401 }
      );
    }

    if (user.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match the currently logged-in account' },
        { status: 400 }
      );
    }

    // Only allow if no admin exists yet (first-time setup)
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'An admin already exists. Use the backoffice to manage roles.' }, { status: 403 });
    }

    // Upsert the profile row (creates it if missing, updates role if it exists)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          role: 'admin',
          verification_status: 'verified',
          phone: user.user_metadata?.phone || null,
          avatar_url: null,
        },
        { onConflict: 'id' }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${email} is now an admin`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
