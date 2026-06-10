import { NextRequest, NextResponse } from 'next/server';
import { refreshQuickBooksTokenIfNeeded } from '@/lib/scheduled-tasks';

/**
 * Vercel Cron Function - Refresh QuickBooks token every 30 minutes
 * 
 * To enable this in Vercel:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/refresh-qb-token",
 *        "schedule": "0 * * * *"
 *      }]
 *    }
 * 
 * 2. Deploy to Vercel
 * 3. The cron will automatically run every hour
 */

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await refreshQuickBooksTokenIfNeeded();
    
    return NextResponse.json({
      success: result.success,
      message: 'Token refresh check completed',
      details: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[BFFDex] Cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
