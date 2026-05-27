import { NextRequest, NextResponse } from 'next/server';

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const SCOPES = 'com.intuit.quickbooks.accounting';

export async function GET(req: NextRequest) {
  const clientId = process.env.QB_CLIENT_ID;
  const redirectUri = process.env.QB_REDIRECT_URI || `${req.nextUrl.origin}/api/quickbooks/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'QuickBooks client ID not configured' },
      { status: 500 }
    );
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  
  const authUrl = new URL(QB_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  // Store state in cookie for verification
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('qb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}
