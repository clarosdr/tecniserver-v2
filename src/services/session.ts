import { supabase } from './supabase';

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
}

export async function getJwt() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session?.access_token || null;
}

export async function withJwtHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getJwt();
  if (!token) {
    return headers;
  }
  return {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };
}

// NOTE: This will be used later with RLS policies.
// For now, it's a placeholder to demonstrate the structure.
export async function getUserRoles(): Promise<string[]> {
  const user = await getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('v_user_roles')
      .select('roles')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user roles:', error.message);
      return [];
    }

    return data?.roles || [];
  } catch (err) {
    console.error('Unexpected error fetching roles:', err);
    return [];
  }
}
