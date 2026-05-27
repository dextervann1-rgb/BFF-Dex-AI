import { NextRequest, NextResponse } from 'next/server';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId');
  const error = searchParams.get('error');

  // Check for errors from QuickBooks
  if (error) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_error=${encodeURIComponent(error)}`
    );
  }

  // Verify state
  const storedState = req.cookies.get('qb_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_error=invalid_state`
    );
  }

  if (!code || !realmId) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_error=missing_params`
    );
  }

  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  const redirectUri = process.env.QB_REDIRECT_URI || `${req.nextUrl.origin}/api/quickbooks/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_error=missing_credentials`
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[BFFDex] QuickBooks token exchange failed:', errorText);
      return NextResponse.redirect(
        `${req.nextUrl.origin}/?qb_error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    
    // In production, store these tokens securely (database, encrypted storage)
    // For now, we'll log them and redirect with success
    console.log('[BFFDex] QuickBooks connected successfully');
    console.log('[BFFDex] Realm ID:', realmId);
    console.log('[BFFDex] Access Token (first 20 chars):', tokens.access_token?.substring(0, 20));
    console.log('[BFFDex] Refresh Token available:', !!tokens.refresh_token);
    
    // Clear the state cookie
    const response = NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_success=true&realm_id=${realmId}`
    );
    response.cookies.delete('qb_oauth_state');

    return response;
  } catch (err) {
    console.error('[BFFDex] QuickBooks OAuth error:', err);
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?qb_error=server_error`
    );
  }
}
