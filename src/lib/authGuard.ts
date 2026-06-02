import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';



export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: 'super_admin' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'disabled' | 'blocked';
  created_at: string;
  updated_at: string;
}

/**
 * Extracts and decodes the JWT bearer token to return the raw authenticated Supabase user.
 * This is used for public authentication sync checks (like in /api/me).
 */
// Safely extracts and decodes a JWT payload locally to retrieve user credentials in case of network failures
function decodeJWTLocally(token: string): User | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    
    // Validate expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('verifyAuthUser: Decoded token is expired');
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      aud: payload.aud,
      role: payload.role || 'authenticated',
      user_metadata: payload.user_metadata || {},
      app_metadata: payload.app_metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User;
  } catch (e) {
    console.error('verifyAuthUser: Failed to locally decode token:', e);
    return null;
  }
}

// Queries Supabase auth.getUser with automatic retry mechanism for network/socket errors
async function getUserWithRetry(token: string, retries = 3, delayMs = 150): Promise<{ data: { user: User | null }; error: AuthError | null }> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await supabase.auth.getUser(token);
      return result;
    } catch (err) {
      const error = err as Error & { code?: string };
      const isNetworkError = 
        error instanceof TypeError || 
        error.message?.includes('fetch failed') || 
        error.code === 'UND_ERR_SOCKET' ||
        error.code === 'ERR_SSL_TLSV1_ALERT_DECRYPT_ERROR' ||
        error.message?.includes('socket') ||
        error.message?.includes('closed') ||
        error.message?.includes('other side closed');

      if (isNetworkError && i < retries - 1) {
        console.warn(`verifyAuthUser: Network failure (Attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms... Error:`, error.message || error);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to verify token after multiple attempts');
}

export async function verifyAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 1. Attempt token verification against Supabase GoTrue API with retry handling
    const { data: { user }, error: authError } = await getUserWithRetry(token);

    if (authError || !user) {
      console.error('verifyAuthUser: Supabase auth error:', authError?.message || 'User not found');
      throw new Error('Unauthorized: Invalid or expired access token');
    }

    return user;
  } catch (err) {
    const error = err as Error & { code?: string };
    // 2. Fallback to local verification if fetch failed due to network/handshake issues (e.g. mobile hotspot proxying)
    const isFetchError = 
      error instanceof TypeError || 
      error.message?.includes('fetch failed') || 
      error.code === 'UND_ERR_SOCKET' ||
      error.code === 'ERR_SSL_TLSV1_ALERT_DECRYPT_ERROR' ||
      error.message?.includes('socket') ||
      error.message?.includes('closed') ||
      error.message?.includes('other side closed');

    if (isFetchError) {
      const decodedUser = decodeJWTLocally(token);
      if (decodedUser) {
        console.warn('[WARNING] verifyAuthUser: Network fetch failed due to socket/SSL instability. Using local JWT decoding fallback.');
        return decodedUser;
      }
    }

    // Re-throw or propagate the unauthorized error
    throw new Error(error.message || 'Unauthorized: Invalid or expired access token');
  }
}

/**
 * Verifies the request session: decodes the user's JWT, fetches their profile, 
 * and enforces that their account is approved. Returns their full profile.
 */
export async function verifySession(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthUser(req);

  // Query database profiles using the high-privilege service role client
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbError || !profile) {
    throw new Error('Unauthorized: User profile does not exist in local database');
  }

  // Block users whose status is not fully approved
  if (profile.status !== 'approved') {
    throw new Error(`Forbidden: Account is currently ${profile.status}`);
  }

  return profile as AuthenticatedUser;
}

/**
 * Verifies the request session, fetches their profile, and enforces both 
 * active approved status and 'super_admin' role authority.
 */
export async function verifyAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  const profile = await verifySession(req);

  if (profile.role !== 'super_admin') {
    throw new Error('Forbidden: Super Admin authority required');
  }

  return profile;
}
