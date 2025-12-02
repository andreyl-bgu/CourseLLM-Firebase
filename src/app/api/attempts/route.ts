import { NextResponse } from 'next/server';
import { FirebaseAttemptService } from '@/lib/firebase-attempt-service';

/**
 * GET /api/attempts
 * List attempts, filtered by quizId and/or studentId
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    const studentId = searchParams.get('studentId');

    let attempts;
    if (quizId && studentId) {
      // Get specific student's attempt for a quiz
      const attempt = await FirebaseAttemptService.getStudentAttempt(quizId, studentId);
      attempts = attempt ? [attempt] : [];
    } else if (quizId) {
      attempts = await FirebaseAttemptService.getByQuiz(quizId);
    } else if (studentId) {
      attempts = await FirebaseAttemptService.getByStudent(studentId);
    } else {
      return NextResponse.json(
        { error: 'quizId or studentId query parameter required' },
        { status: 400 }
      );
    }

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('[API] GET /api/attempts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attempts
 * Create a new attempt
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const attempt = await FirebaseAttemptService.create(body);
    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/attempts error:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}

