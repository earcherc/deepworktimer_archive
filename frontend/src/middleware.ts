import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_API_URL;
const SESSION_VALIDATION_ENDPOINT = `${API_URL}/auth/validate-session`;

async function validateSessionToken(sessionId: string): Promise<boolean> {
  if (!sessionId) {
    return false;
  }

  try {
    const response = await fetch(SESSION_VALIDATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Session validation failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session_id');

    if (!sessionCookie) {
      console.log('No session cookie found, redirecting to login');
      return redirectToLogin(request);
    }

    const isValidSession = await validateSessionToken(sessionCookie.value);

    if (!isValidSession) {
      console.log('Invalid session, redirecting to login');
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.nextUrl.origin);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/home/:path*', '/profile/:path*', '/social/:path*'],
};
