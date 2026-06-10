import { NextRequest, NextResponse } from 'next/server';
import { getActiveQuickBooksToken, saveQuickBooksToken } from '@/lib/supabase';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.QB_CLIENT_ID;
    const clientSecret = process.env.QB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'QuickBooks credentials not configured' },
        { status: 500 }
      );
    }

    // Get the active token from Supabase
    const storedToken = await getActiveQuickBooksToken();

    if (!storedToken) {
      return NextResponse.json(
        { success: false, error: 'No QuickBooks token found. Please complete OAuth flow first.' },
        { status: 400 }
      );
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(storedToken.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry > 5 * 60 * 1000) {
      // Token is still valid
      return NextResponse.json({
        success: true,
        message: 'Token is still valid',
        expires_at: storedToken.expires_at,
      });
    }

    console.log('[BFFDex] Refreshing QuickBooks token...');

    // Refresh the token
    const refreshResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: storedToken.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('[BFFDex] Token refresh failed:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to refresh token' },
        { status: 500 }
      );
    }

    const newTokens = await refreshResponse.json();

    // Calculate new expiration time
    const expiresIn = newTokens.expires_in || 3600;
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Save the new tokens to Supabase
    await saveQuickBooksToken({
      realm_id: storedToken.realm_id,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_type: newTokens.token_type || 'Bearer',
      expires_at: newExpiresAt,
      is_active: true,
    });

    console.log('[BFFDex] QuickBooks token refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expires_at: newExpiresAt,
    });
  } catch (error) {
    console.error('[BFFDex] Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
