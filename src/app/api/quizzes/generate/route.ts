import { NextResponse } from 'next/server';
import { generateQuiz } from '@/ai/flows/quiz-generation';

/**
 * POST /api/quizzes/generate
 * Generate quiz questions using AI
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { courseContent, learningObjectives, numberOfQuestions, difficulty, topics } = body;

    // Validate required fields
    if (!courseContent || !learningObjectives || !numberOfQuestions || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: courseContent, learningObjectives, numberOfQuestions, difficulty' },
        { status: 400 }
      );
    }

    // Call the AI flow to generate quiz
    const result = await generateQuiz({
      courseContent,
      learningObjectives,
      numberOfQuestions,
      difficulty,
      topics,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/quizzes/generate error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
