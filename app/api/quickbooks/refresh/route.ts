import { NextResponse } from 'next/server';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export async function POST(req: Request) {
  const { refresh_token } = await req.json();

  if (!refresh_token) {
    return NextResponse.json(
      { error: 'Refresh token required' },
      { status: 400 }
    );
  }

  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'QuickBooks credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[BFFDex] QuickBooks token refresh failed:', errorText);
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();
    
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    });
  } catch (err) {
    console.error('[BFFDex] Token refresh error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
