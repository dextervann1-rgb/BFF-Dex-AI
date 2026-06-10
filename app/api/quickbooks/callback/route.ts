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
    
    // IMPORTANT: Store these tokens in your Vercel environment variables
    // After seeing the logs below, add these to your Vercel project settings:
    // QB_REALM_ID={realmId}
    // QB_ACCESS_TOKEN={tokens.access_token}
    // QB_REFRESH_TOKEN={tokens.refresh_token}
    // QB_VENDOR_ID and QB_EXPENSE_ACCOUNT_ID must be set manually in QB
    
    console.log('[BFFDex] ===== QUICKBOOKS OAUTH SUCCESS =====');
    console.log('[BFFDex] Copy these values to Vercel environment variables:');
    console.log('[BFFDex] QB_REALM_ID:', realmId);
    console.log('[BFFDex] QB_ACCESS_TOKEN:', tokens.access_token);
    console.log('[BFFDex] QB_REFRESH_TOKEN:', tokens.refresh_token);
    console.log('[BFFDex] QB_TOKEN_TYPE:', tokens.token_type);
    console.log('[BFFDex] QB_EXPIRES_IN:', tokens.expires_in);
    console.log('[BFFDex] ===== END QUICKBOOKS OAUTH =====');
    
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
