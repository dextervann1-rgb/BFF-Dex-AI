# BFFDex AI - Vercel Deployment Guide

This guide covers deploying BFFDex AI to Vercel with all required environment variables and integrations.

## Prerequisites

- Vercel account and project linked to this GitHub repository
- Anthropic API key (Claude AI)
- ElevenLabs API key and Voice ID for voice verification
- Base chain wallet private key (for USDC payments on Base)
- QuickBooks OAuth credentials (optional, for expense logging)
- EAS schema UID on Base chain (optional, for on-chain attestations)

## Step 1: Core Environment Variables

Add these to your Vercel project settings under **Settings > Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude AI API key | `sk-ant-...` |
| `WALLET_PRIVATE_KEY` | Base chain wallet private key | `0x...` |
| `KINGDOM_WALLET` | MaShabak payment routing wallet | `0x609bd77f622fd9f2f2fb5882fd0795c15aa1d0c5` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `sk_...` |
| `DEXTER_VOICE_ID` | Your ElevenLabs Voice ID | `21m00Tcm4TlvDq8ikWAM` |
| `PAYMENT_SCHEMA_UID` | EAS schema UID on Base | `0x...` |

## Step 2: QuickBooks Integration (Optional)

### OAuth Setup

1. Create a QuickBooks app at [developer.intuit.com](https://developer.intuit.com)
2. Get your **Client ID** and **Client Secret**
3. Set your redirect URI to: `https://your-domain.vercel.app/api/quickbooks/callback`

### Environment Variables for OAuth

Add these to Vercel:

| Variable | Description |
|----------|-------------|
| `QB_CLIENT_ID` | QuickBooks OAuth Client ID |
| `QB_CLIENT_SECRET` | QuickBooks OAuth Client Secret |
| `QB_REDIRECT_URI` | `https://your-domain.vercel.app/api/quickbooks/callback` |

### Completing the OAuth Flow

1. Visit your deployed app and navigate to Settings
2. Click "Connect QuickBooks"
3. Authorize the app in the QuickBooks login flow
4. After authorization, **check your Vercel deployment logs** for the output that looks like:

```
[BFFDex] ===== QUICKBOOKS OAUTH SUCCESS =====
[BFFDex] Copy these values to Vercel environment variables:
[BFFDex] QB_REALM_ID: 1234567890
[BFFDex] QB_ACCESS_TOKEN: eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0...
[BFFDex] QB_REFRESH_TOKEN: eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0...
[BFFDex] QB_TOKEN_TYPE: Bearer
[BFFDex] QB_EXPIRES_IN: 3600
[BFFDex] ===== END QUICKBOOKS OAUTH =====
```

5. Copy the **QB_REALM_ID** and **QB_ACCESS_TOKEN** to your Vercel environment variables
6. Also set **QB_VENDOR_ID** and **QB_EXPENSE_ACCOUNT_ID** (these must be created manually in QuickBooks)

## Step 3: Verify Deployment

After pushing to GitHub, Vercel will automatically deploy. Check:

1. **Build logs** - Should complete without errors
2. **Runtime logs** - Monitor for any missing environment variable warnings
3. **Test the app** - Visit your deployment URL and verify:
   - Chat interface loads
   - Voice recording works
   - Payment parsing works (try pasting an EIP-681 link)
   - Balance check works (if wallet is funded)

## Troubleshooting

### Build Fails with "Missing environment variable"

**Solution:** Add the missing variable to Vercel Settings > Environment Variables and redeploy.

### QuickBooks sync not working

**Solution:** Check that `QB_REALM_ID` and `QB_ACCESS_TOKEN` are set in Vercel env vars. If missing, complete the OAuth flow again and copy the tokens from the logs.

### Voice verification fails

**Solution:** Verify that `ELEVENLABS_API_KEY` and `DEXTER_VOICE_ID` are correctly set in Vercel.

### Payments not executing

**Solution:** Ensure `WALLET_PRIVATE_KEY` is set and the wallet has USDC balance on Base chain.

## Security Notes

- **Never commit `.env.local` to version control**
- All private keys and API keys should only be stored in Vercel environment variables
- Use separate Vercel environments (Preview, Production) with different API keys if possible
- Regularly rotate QuickBooks refresh tokens

## Support

For issues with:
- **Vercel deployment:** Check Vercel docs and deployment logs
- **QuickBooks:** See [Intuit Developer docs](https://developer.intuit.com)
- **ElevenLabs:** See [ElevenLabs API docs](https://elevenlabs.io/docs)
- **Ethereum/Base:** See [Base docs](https://docs.base.org)
