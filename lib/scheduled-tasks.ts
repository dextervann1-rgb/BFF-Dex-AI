/**
 * Scheduled Tasks for BFFDex AI
 * 
 * This file contains logic for background tasks that should run periodically.
 * In production, these can be triggered via:
 * - Vercel Cron Functions
 * - External cron services (e.g., EasyCron, AWS EventBridge)
 * - Database-driven job queues (e.g., Bull, Temporal)
 */

import { getActiveQuickBooksToken, saveQuickBooksToken } from './supabase';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

/**
 * Refresh QuickBooks token if it's expired or about to expire
 * Should be called every 30 minutes
 */
export async function refreshQuickBooksTokenIfNeeded() {
  try {
    const clientId = process.env.QB_CLIENT_ID;
    const clientSecret = process.env.QB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log('[BFFDex] QuickBooks credentials not configured, skipping token refresh');
      return { success: false, reason: 'credentials_not_configured' };
    }

    const storedToken = await getActiveQuickBooksToken();

    if (!storedToken) {
      console.log('[BFFDex] No QuickBooks token found, skipping refresh');
      return { success: false, reason: 'no_token_found' };
    }

    // Check if token is expired or about to expire (within 10 minutes)
    const expiresAt = new Date(storedToken.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry > 10 * 60 * 1000) {
      console.log('[BFFDex] QuickBooks token still valid, no refresh needed');
      return { success: true, reason: 'token_still_valid' };
    }

    console.log('[BFFDex] Refreshing QuickBooks token...');

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
      return { success: false, reason: 'refresh_failed', error: errorText };
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

    console.log('[BFFDex] QuickBooks token refreshed successfully, expires at:', newExpiresAt);
    return { success: true, reason: 'token_refreshed', expires_at: newExpiresAt };
  } catch (error) {
    console.error('[BFFDex] Token refresh error:', error);
    return { success: false, reason: 'error', error: String(error) };
  }
}

/**
 * Cleanup old transaction records (optional)
 * Keeps only the last 90 days of transactions
 * Should be called weekly
 */
export async function cleanupOldTransactions() {
  console.log('[BFFDex] Cleanup task would run here (not yet implemented)');
  // TODO: Implement when needed
  return { success: true, reason: 'not_implemented' };
}
