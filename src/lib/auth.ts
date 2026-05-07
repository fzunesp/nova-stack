import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'session';
const SECRET_KEY = process.env.SESSION_SECRET || 'dev-secret-key-do-not-use-in-production';
// Fallback dev user ID which should match the seed's admin user if needed
export const DEFAULT_DEV_USER_ID = 'dev_user_123'; 

function sign(value: string): string {
  const hmac = createHmac('sha256', SECRET_KEY);
  hmac.update(value);
  const signature = hmac.digest('base64url');
  return `${value}.${signature}`;
}

function verify(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [value, signature] = parts;
  const expectedSignature = sign(value).split('.')[1];
  
  if (signature.length !== expectedSignature.length) return null;
  
  const isValid = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
  
  return isValid ? value : null;
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  return verify(sessionCookie.value);
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  
  if (!userId) {
    if (process.env.NODE_ENV === 'development' || process.env.AUTH_BYPASS === 'true') {
      return DEFAULT_DEV_USER_ID;
    }
    throw new Error('Unauthorized');
  }
  
  return userId;
}

export async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  const signedValue = sign(userId);
  
  cookieStore.set(SESSION_COOKIE, signedValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
