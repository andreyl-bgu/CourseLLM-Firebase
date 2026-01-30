'use client';

/**
 * Student Quiz Results Page
 * 
 * Displays quiz results with score, answers, and explanations.
 * Students can review their performance and retake the quiz.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { courses } from '@/lib/mock-data';
import { Quiz, QuizAttempt, QuizQuestion } from '@/lib/types';
import { CheckCircle, XCircle, Trophy, Target, Clock, RotateCcw, Home, Loader2 } from 'lucide-react';

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const attemptId = params.attemptId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch quiz and attempt from API
        const [foundQuiz, foundAttempt] = await Promise.all([
          QuizApiClient.getById(quizId),
          QuizApiClient.getAttemptById(attemptId)
        ]);
        
        setQuiz(foundQuiz || null);
        setAttempt(foundAttempt || null);
      } catch (error) {
        console.error('Error fetching quiz results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [quizId, attemptId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Loading results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 text-lg">Results not found.</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/student/quizzes')}
              style={{ backgroundColor: '#3F51B5' }}
            >
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const course = courses.find((c) => c.id === quiz.courseId);
  const scorePercentage = (attempt.score / attempt.maxScore) * 100;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = quiz.questions.length;

  // Get performance message
  const getPerformanceMessage = () => {
    if (scorePercentage >= 90) return { text: 'Excellent!', color: 'text-green-600' };
    if (scorePercentage >= 75) return { text: 'Great job!', color: 'text-blue-600' };
    if (scorePercentage >= 60) return { text: 'Good effort!', color: 'text-yellow-600' };
    return { text: 'Keep practicing!', color: 'text-orange-600' };
  };

  const performance = getPerformanceMessage();

  // Get question by ID
  const getQuestion = (questionId: string): QuizQuestion | undefined => {
    return quiz.questions.find((q) => q.id === questionId);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#3F51B5' }}>
          Quiz Results
        </h1>
        <p className="text-gray-600">{quiz.title} • {course?.title}</p>
      </div>

      {/* Score Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Your Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4" 
                 style={{ backgroundColor: '#ECEFF1' }}>
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#3F51B5' }}>
                  {scorePercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">
                  {attempt.score}/{attempt.maxScore} pts
                </div>
              </div>
            </div>
            <p className={`text-2xl font-semibold ${performance.color}`}>
              {performance.text}
            </p>
          </div>

          <Progress value={scorePercentage} className="h-3 mb-6" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: '#3F51B5' }}>
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {correctCount}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {totalQuestions - correctCount}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex gap-4">
            <Link href={`/student/quizzes/${quiz.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </Link>
            <Link href="/student/quizzes" className="flex-1">
              <Button className="w-full" style={{ backgroundColor: '#3F51B5' }}>
                <Home className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>
            Review your answers and learn from explanations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {attempt.answers.map((answer, index) => {
              const question = getQuestion(answer.questionId);
              if (!question) return null;

              const correctAnswer = Array.isArray(question.correctAnswer)
                ? question.correctAnswer.join(', ')
                : question.correctAnswer;

              return (
                <AccordionItem key={answer.questionId} value={`question-${index}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-left">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="flex-1">
                        Question {index + 1}: {question.questionText.substring(0, 60)}
                        {question.questionText.length > 60 ? '...' : ''}
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {answer.pointsEarned}/{question.points} pts
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Full Question */}
                      <div>
                        <h4 className="font-semibold mb-2">Question:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{question.questionText}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge variant="outline">{question.questionType}</Badge>
                        </div>
                      </div>

                      {/* Your Answer */}
                      <div>
                        <h4 className="font-semibold mb-2">Your Answer:</h4>
                        <p className={`p-3 rounded ${answer.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          {Array.isArray(answer.studentAnswer)
                            ? answer.studentAnswer.join(', ')
                            : answer.studentAnswer || '(No answer provided)'}
                        </p>
                      </div>

                      {/* Correct Answer */}
                      {!answer.isCorrect && (
                        <div>
                          <h4 className="font-semibold mb-2">Correct Answer:</h4>
                          <p className="p-3 rounded bg-green-50 text-green-800">
                            {correctAnswer}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      <div>
                        <h4 className="font-semibold mb-2">Explanation:</h4>
                        <p className="p-3 rounded bg-blue-50 text-blue-900">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Action Buttons (Mobile) */}
      <div className="mt-6 flex flex-col sm:hidden gap-3">
        <Link href={`/student/quizzes/${quiz.id}`}>
          <Button variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
        </Link>
        <Link href="/student/quizzes">
          <Button className="w-full" style={{ backgroundColor: '#3F51B5' }}>
            <Home className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Button>
        </Link>
      </div>
    </div>
  );
}

