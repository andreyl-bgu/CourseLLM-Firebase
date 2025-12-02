import { NextResponse } from 'next/server';
import { FirebaseQuizService } from '@/lib/firebase-quiz-service';

/**
 * GET /api/quizzes
 * List all quizzes, optionally filtered by courseId or teacherId
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const teacherId = searchParams.get('teacherId');

    let quizzes;
    if (courseId) {
      quizzes = await FirebaseQuizService.getByCourse(courseId);
    } else if (teacherId) {
      quizzes = await FirebaseQuizService.getByTeacher(teacherId);
    } else {
      quizzes = await FirebaseQuizService.getAll();
    }

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('[API] GET /api/quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Create a new quiz
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quiz = await FirebaseQuizService.add(body);
    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

