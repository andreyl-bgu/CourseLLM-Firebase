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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code || 'UNKNOWN';
    return NextResponse.json(
      { 
        error: 'Failed to fetch quizzes',
        message: errorMessage,
        code: errorCode
      },
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
    
    console.log('[API] POST /api/quizzes - Received quiz data:', {
      hasTitle: !!body.title,
      hasCourseId: !!body.courseId,
      hasCreatedBy: !!body.createdBy,
      questionsCount: body.questions?.length || 0,
      totalPoints: body.totalPoints,
      difficulty: body.difficulty,
    });
    
    const quiz = await FirebaseQuizService.add(body);
    
    console.log('[API] POST /api/quizzes - Quiz created successfully:', quiz.id);
    
    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/quizzes error:', error);
    console.error('[API] POST /api/quizzes - Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200),
    });
    return NextResponse.json(
      { 
        error: 'Failed to create quiz',
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
