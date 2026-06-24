'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUPABASE_AVAILABLE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');
const DEV_MODE = !SUPABASE_AVAILABLE;

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (DEV_MODE) {
    // Development mode: store credentials in cookie
    const cookieStore = await cookies();
    cookieStore.set('dev_user', JSON.stringify({ email, role: 'external_user' }), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      path: '/',
    });
    revalidatePath('/', 'layout');
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  if (DEV_MODE) {
    // Development mode: create mock user
    const cookieStore = await cookies();
    cookieStore.set('dev_user', JSON.stringify({ email, fullName, phone, role: 'external_user' }), {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      path: '/',
    });
    revalidatePath('/', 'layout');
    return { success: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone || null },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      verification_status: 'unverified',
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function logout() {
  if (DEV_MODE) {
    const cookieStore = await cookies();
    cookieStore.delete('dev_user');
    revalidatePath('/', 'layout');
    redirect('/');
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
