import { getActiveQuickBooksToken } from './supabase';

interface QuickBooksExpensePayload {
  amount: number;
  vendor: string;
  memo: string;
  category: string;
  txHash: string;
}

export async function createQuickBooksExpense({
  amount,
  vendor,
  memo,
  category,
  txHash,
}: QuickBooksExpensePayload): Promise<{ success: boolean; error?: string }> {
  // Try to get tokens from Supabase first, fall back to env vars
  let realmId = process.env.QB_REALM_ID;
  let accessToken = process.env.QB_ACCESS_TOKEN;

  // If not in env vars, try to fetch from Supabase
  if (!realmId || !accessToken) {
    const storedToken = await getActiveQuickBooksToken();
    if (storedToken) {
      realmId = storedToken.realm_id;
      accessToken = storedToken.access_token;
    }
  }

  if (!realmId || !accessToken) {
    console.error('[BFFDex] QuickBooks not configured - missing credentials');
    return { success: false, error: 'QuickBooks not configured' };
  }

  try {
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/purchase?minorversion=65`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          PaymentType: 'Cash',
          TotalAmt: amount,
          TxnDate: new Date().toISOString().split('T')[0],
          EntityRef: {
            value: process.env.QB_VENDOR_ID,
            name: category,
          },
          Line: [
            {
              Amount: amount,
              DetailType: 'AccountBasedExpenseLineDetail',
              AccountBasedExpenseLineDetail: {
                AccountRef: { value: process.env.QB_EXPENSE_ACCOUNT_ID },
              },
              Description: `${memo} | TX: ${txHash}`,
            },
          ],
          PrivateNote: `EIP-681 payment to ${vendor} | Voice-verified via BFFDex AI`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFFDex] QuickBooks sync failed:', errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error('[BFFDex] QuickBooks error:', error);
    return { success: false, error: String(error) };
  }
}
