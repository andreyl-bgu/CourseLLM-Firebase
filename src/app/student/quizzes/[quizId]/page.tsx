'use client';

/**
 * Student Quiz Taking Page
 * 
 * Allows students to take a quiz by answering questions.
 * Supports multiple question types and auto-saves answers.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { quizAttempts, courses } from '@/lib/mock-data';
import { Quiz, QuizQuestion, QuizAnswer, QuizAttempt } from '@/lib/types';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock current student ID
const CURRENT_STUDENT_ID = 'student-1';

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const foundQuiz = await QuizApiClient.getById(quizId);
        if (foundQuiz) {
          setQuiz(foundQuiz);
          
          // Check if there's an in-progress attempt
          const inProgressAttempt = quizAttempts.find(
            (a) => a.quizId === quizId && a.studentId === CURRENT_STUDENT_ID && a.status === 'in-progress'
          );
          
          if (inProgressAttempt) {
            // Restore previous answers
            const restoredAnswers: Record<string, string> = {};
            inProgressAttempt.answers.forEach((answer) => {
              restoredAnswers[answer.questionId] = Array.isArray(answer.studentAnswer)
                ? answer.studentAnswer.join(', ')
                : answer.studentAnswer;
            });
            setAnswers(restoredAnswers);
          }
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 text-lg">Quiz not found.</p>
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

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;
  const course = courses.find((c) => c.id === quiz.courseId);

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Calculate score
  const calculateScore = (): { score: number; answers: QuizAnswer[] } => {
    let totalScore = 0;
    const quizAnswers: QuizAnswer[] = [];

    quiz.questions.forEach((question) => {
      const studentAnswer = answers[question.id] || '';
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.join(', ')
        : question.correctAnswer;

      // Simple comparison (case-insensitive, trimmed)
      const isCorrect =
        studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      const pointsEarned = isCorrect ? question.points : 0;

      totalScore += pointsEarned;
      quizAnswers.push({
        questionId: question.id,
        studentAnswer,
        isCorrect,
        pointsEarned,
      });
    });

    return { score: totalScore, answers: quizAnswers };
  };

  // Submit quiz
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Calculate score
      const { score, answers: quizAnswers } = calculateScore();

      // Create quiz attempt and save to Firebase
      const attemptData = {
        quizId: quiz.id,
        studentId: CURRENT_STUDENT_ID,
        courseId: quiz.courseId,
        status: 'completed' as const,
        score,
        maxScore: quiz.totalPoints,
        answers: quizAnswers,
      };

      // Save to Firebase
      const savedAttempt = await QuizApiClient.createAttempt(attemptData);

      toast({
        title: 'Quiz Submitted!',
        description: `You scored ${score} out of ${quiz.totalPoints} points (${Math.round((score / quiz.totalPoints) * 100)}%).`,
      });

      // Navigate to results page
      router.push(`/student/quizzes/${quiz.id}/results/${savedAttempt.id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'There was an error submitting your quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: '#3F51B5' }}>
            {quiz.title}
          </h1>
          <Badge className={getDifficultyColor(quiz.difficulty)}>
            {quiz.difficulty}
          </Badge>
        </div>
        <p className="text-gray-600">{course?.title}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-gray-600">
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            Question {currentQuestionIndex + 1}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{currentQuestion.topic}</Badge>
            <Badge variant="outline">{currentQuestion.points} points</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6 whitespace-pre-wrap">{currentQuestion.questionText}</p>

          {/* Multiple Choice */}
          {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* True/False */}
          {currentQuestion.questionType === 'true-false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id="true-option" />
                  <Label htmlFor="true-option" className="cursor-pointer flex-1">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id="false-option" />
                  <Label htmlFor="false-option" className="cursor-pointer flex-1">
                    False
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}

          {/* Short Answer */}
          {currentQuestion.questionType === 'short-answer' && (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer..."
              className="min-h-[100px]"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              style={{ backgroundColor: '#3F51B5' }}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              style={{ backgroundColor: '#3F51B5' }}
              disabled={answeredCount === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-yellow-600 font-semibold">
                  Warning: You have {totalQuestions - answeredCount} unanswered question(s).
                </span>
              )}
              <span className="block mt-2">
                Are you sure you want to submit your quiz? This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ backgroundColor: '#3F51B5' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

