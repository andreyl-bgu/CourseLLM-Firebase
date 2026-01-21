import { NextResponse } from 'next/server';
import {
  getSystemMetrics,
  getFormattedMetrics,
  initializeMonitoring,
} from '@/lib/monitoring-service';

// Initialize monitoring on module load (server only)
if (typeof window === 'undefined') {
  initializeMonitoring();
}

/**
 * GET /api/monitoring
 * Get current CPU and RAM usage metrics
 *
 * Query parameters:
 * - format: 'raw' | 'formatted' (default: 'raw')
 *   - 'raw': Returns raw numeric values
 *   - 'formatted': Returns human-readable formatted strings
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'raw';

    const headers = {
      'Cache-Control': 'no-store, max-age=0',
    };

    if (format === 'formatted') {
      const formattedMetrics = getFormattedMetrics();
      return NextResponse.json({ success: true, data: formattedMetrics }, { headers });
    }

    const metrics = getSystemMetrics();
    return NextResponse.json({ success: true, data: metrics }, { headers });
  } catch (error) {
    console.error('[API] GET /api/monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

