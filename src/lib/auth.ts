import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Signup failed');

  return {
    id: data.user.id,
    email: data.user.email || email,
    name: name,
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed');

  return {
    id: data.user.id,
    email: data.user.email || email,
    name: data.user.user_metadata?.full_name || 'Investor',
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || 'Investor',
  };
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || 'Investor',
      });
    } else {
      callback(null);
    }
  });
}
