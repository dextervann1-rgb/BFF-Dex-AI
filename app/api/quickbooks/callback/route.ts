import { NextRequest, NextResponse } from 'next/server';
import { saveQuickBooksToken } from '@/lib/supabase';

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
    
    // Calculate expiration time
    const expiresIn = tokens.expires_in || 3600; // Default to 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Save tokens to Supabase for automatic rotation
    const savedToken = await saveQuickBooksToken({
      realm_id: realmId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type || 'Bearer',
      expires_at: expiresAt,
      is_active: true,
    });

    if (savedToken) {
      console.log('[BFFDex] ===== QUICKBOOKS OAUTH SUCCESS =====');
      console.log('[BFFDex] Tokens saved to Supabase automatically!');
      console.log('[BFFDex] Realm ID:', realmId);
      console.log('[BFFDex] Token expires at:', expiresAt);
      console.log('[BFFDex] ===== END QUICKBOOKS OAUTH =====');
    } else {
      console.warn('[BFFDex] Tokens saved but Supabase storage failed. Showing tokens in logs:');
      console.log('[BFFDex] QB_REALM_ID:', realmId);
      console.log('[BFFDex] QB_ACCESS_TOKEN:', tokens.access_token);
      console.log('[BFFDex] QB_REFRESH_TOKEN:', tokens.refresh_token);
    }
    
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
