import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Lightweight health endpoint for dashboards and uptime checks.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      node: process.version,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

