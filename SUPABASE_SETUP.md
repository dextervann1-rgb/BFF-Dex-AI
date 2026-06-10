# Supabase Setup Guide for BFFDex AI

This guide walks you through setting up Supabase for persistent transaction storage and automated QuickBooks token rotation.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Choose your organization and give it a name (e.g., "bffdex-ai")
4. Set a strong database password
5. Choose your region (closest to your users)
6. Click "Create new project" and wait for it to initialize

## Step 2: Get Your Credentials

Once your project is created:

1. Go to **Settings > API** in the Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (public key for client-side operations)
   - **Service Role Key** (secret key for server-side operations)

## Step 3: Initialize the Database Schema

1. In the Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_init_schema.sql` from the repository
4. Paste it into the SQL editor
5. Click "Run"

This will create all necessary tables:
- `transactions` - stores all payment records
- `quickbooks_tokens` - stores QB tokens for automatic refresh
- `voice_logs` - audit trail for voice verifications
- `eas_attestations` - on-chain attestation records

## Step 4: Add Environment Variables to Vercel

In your Vercel project settings, add:

| Variable | Value |
| :--- | :--- |
| `SUPABASE_URL` | Your Project URL from Step 2 |
| `SUPABASE_ANON_KEY` | Your Anon Key from Step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key from Step 2 |
| `CRON_SECRET` | Generate a random secret (e.g., `openssl rand -base64 32`) |

## Step 5: Enable Vercel Cron (Optional but Recommended)

To automatically refresh QuickBooks tokens every hour:

1. Create a `vercel.json` file in your project root:

```json
{
  "crons": [{
    "path": "/api/cron/refresh-qb-token",
    "schedule": "0 * * * *"
  }]
}
```

2. Add `CRON_SECRET` to your Vercel environment variables (see Step 4)
3. Deploy to Vercel
4. The cron job will automatically run every hour

## Step 6: Test the Integration

### Test Transaction Persistence

1. Deploy your app to Vercel
2. Make a test payment through the chat interface
3. In Supabase dashboard, go to **SQL Editor** and run:

```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

You should see your test transaction!

### Test QuickBooks Token Storage

1. Complete the QuickBooks OAuth flow in your app
2. In Supabase, run:

```sql
SELECT realm_id, token_type, expires_at, is_active FROM quickbooks_tokens;
```

You should see your QB token stored and ready for automatic refresh.

## Troubleshooting

### "Supabase not configured" warning

**Solution:** Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in your Vercel environment variables.

### Transactions not saving

**Solution:** Check that `SUPABASE_SERVICE_ROLE_KEY` is set. This is required for server-side writes.

### QuickBooks token not refreshing

**Solution:** Ensure `CRON_SECRET` is set and the cron job is enabled in `vercel.json`. Check Vercel's cron logs for errors.

### Row Level Security (RLS) errors

**Solution:** The default RLS policies allow all authenticated users to read and write. For production, you may want to restrict this further. See Supabase docs on RLS.

## Data Retention Policy

By default, all transactions are stored indefinitely. To implement a cleanup policy:

1. In Supabase, create a scheduled function to delete old records
2. Or manually run cleanup queries periodically

Example cleanup query (keeps last 90 days):

```sql
DELETE FROM transactions 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security Best Practices

- **Never commit credentials** to version control
- **Use Service Role Key only on server** - it has full database access
- **Rotate credentials** periodically
- **Enable RLS policies** for multi-tenant scenarios
- **Monitor database usage** in Supabase dashboard
- **Set up backups** in Supabase project settings

## Next Steps

Once Supabase is configured:

1. Deploy to Vercel with the new environment variables
2. Test the transaction history feature
3. Monitor the Supabase dashboard for any errors
4. Set up automated backups in Supabase settings

For more information, see [Supabase documentation](https://supabase.com/docs).
