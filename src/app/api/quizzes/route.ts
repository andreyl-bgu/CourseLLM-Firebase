import { NextResponse } from 'next/server';
import { FirebaseQuizService } from '@/lib/firebase-quiz-service';

/**
 * GET /api/quizzes
 * List all quizzes, optionally filtered by courseId or teacherId
 */
export async function GET(req: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:8',message:'GET /api/quizzes called',data:{url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const teacherId = searchParams.get('teacherId');

    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:14',message:'Query params parsed',data:{courseId,teacherId,hasCourseId:!!courseId,hasTeacherId:!!teacherId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    let quizzes;
    if (courseId) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:18',message:'Calling getByCourse',data:{courseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      quizzes = await FirebaseQuizService.getByCourse(courseId);
    } else if (teacherId) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:22',message:'Calling getByTeacher',data:{teacherId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      quizzes = await FirebaseQuizService.getByTeacher(teacherId);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:26',message:'Calling getAll',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      quizzes = await FirebaseQuizService.getAll();
    }

    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:30',message:'Quizzes fetched successfully',data:{count:quizzes?.length||0,isEmpty:!quizzes||quizzes.length===0,firstQuizId:quizzes?.[0]?.id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(quizzes);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/quizzes/route.ts:35',message:'GET /api/quizzes error',data:{error:error instanceof Error?error.message:'Unknown',code:(error as any)?.code||'N/A',stack:(error as Error)?.stack?.substring(0,200)||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
    
    // #region agent log
    console.log('[API] POST /api/quizzes - Received quiz data:', {
      hasTitle: !!body.title,
      hasCourseId: !!body.courseId,
      hasCreatedBy: !!body.createdBy,
      questionsCount: body.questions?.length || 0,
      totalPoints: body.totalPoints,
      difficulty: body.difficulty,
    });
    // #endregion
    
    const quiz = await FirebaseQuizService.add(body);
    
    // #region agent log
    console.log('[API] POST /api/quizzes - Quiz created successfully:', quiz.id);
    // #endregion
    
    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/quizzes error:', error);
    // #region agent log
    console.error('[API] POST /api/quizzes - Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200),
    });
    // #endregion
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

