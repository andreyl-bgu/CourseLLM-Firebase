import { NextResponse } from 'next/server';
import { FirebaseQuizService } from '@/lib/firebase-quiz-service';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/quizzes/[id]
 * Get a quiz by ID
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quiz = await FirebaseQuizService.getById(id);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('[API] GET /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quizzes/[id]
 * Update a quiz
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const quiz = await FirebaseQuizService.update(id, body);
    return NextResponse.json(quiz);
  } catch (error) {
    console.error('[API] PUT /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes/[id]
 * Delete a quiz
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await FirebaseQuizService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API] DELETE /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}

