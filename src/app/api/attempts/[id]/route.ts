import { NextResponse } from 'next/server';
import { FirebaseAttemptService } from '@/lib/firebase-attempt-service';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/attempts/[id]
 * Get an attempt by ID
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const attempt = await FirebaseAttemptService.getById(id);

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('[API] GET /api/attempts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/attempts/[id]
 * Update an attempt
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const attempt = await FirebaseAttemptService.update(id, body);
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('[API] PUT /api/attempts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update attempt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attempts/[id]
 * Delete an attempt
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await FirebaseAttemptService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API] DELETE /api/attempts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
}

