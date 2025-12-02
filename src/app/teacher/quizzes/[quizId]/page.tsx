'use client';

/**
 * Teacher Quiz Detail Page
 * 
 * Displays detailed information about a specific quiz including:
 * - Quiz metadata and questions
 * - Student performance statistics
 * - Individual student attempts
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { quizAttempts, courses, students } from '@/lib/mock-data';
import { Quiz, QuizAttempt } from '@/lib/types';
import { ArrowLeft, Users, Trophy, BarChart, Target, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TeacherQuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const foundQuiz = await QuizApiClient.getById(quizId);
        setQuiz(foundQuiz || null);

        const quizAttemptsList = quizAttempts.filter(
          (a) => a.quizId === quizId && a.status === 'completed'
        );
        setAttempts(quizAttemptsList);
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Loading quiz details...</p>
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
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 text-lg">Quiz not found.</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/teacher/quizzes')}
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

  // Calculate statistics
  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
      : 0;
  const averagePercentage = quiz.totalPoints > 0 ? (averageScore / quiz.totalPoints) * 100 : 0;

  // Question statistics
  const questionStats = quiz.questions.map((question) => {
    const correctCount = attempts.filter((attempt) =>
      attempt.answers.find((a) => a.questionId === question.id && a.isCorrect)
    ).length;
    const incorrectCount = totalAttempts - correctCount;
    const correctPercentage = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    return {
      question,
      correctCount,
      incorrectCount,
      correctPercentage,
    };
  });

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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/teacher/quizzes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold" style={{ color: '#3F51B5' }}>
                {quiz.title}
              </h1>
              <Badge className={getDifficultyColor(quiz.difficulty)}>
                {quiz.difficulty}
              </Badge>
            </div>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-3xl font-bold" style={{ color: '#3F51B5' }}>
                  {totalAttempts}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold" style={{ color: '#3F51B5' }}>
                  {averagePercentage.toFixed(0)}%
                </p>
              </div>
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questions</p>
                <p className="text-3xl font-bold" style={{ color: '#3F51B5' }}>
                  {quiz.questions.length}
                </p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Points</p>
                <p className="text-3xl font-bold" style={{ color: '#3F51B5' }}>
                  {quiz.totalPoints}
                </p>
              </div>
              <BarChart className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{quiz.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Topics Covered</h3>
              <div className="flex flex-wrap gap-2">
                {quiz.topics.map((topic, index) => (
                  <Badge key={index} variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Created</h3>
              <p className="text-gray-700">
                {new Date(quiz.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question Performance</CardTitle>
          <CardDescription>
            How students performed on each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {questionStats.map((stat, index) => (
              <AccordionItem key={stat.question.id} value={`question-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 text-left w-full">
                    <span className="font-semibold">Q{index + 1}</span>
                    <span className="flex-1 line-clamp-1">{stat.question.questionText}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stat.question.points}pts</Badge>
                      <Badge
                        className={
                          stat.correctPercentage >= 70
                            ? 'bg-green-100 text-green-800'
                            : stat.correctPercentage >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {stat.correctPercentage.toFixed(0)}% correct
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="font-semibold mb-1">Question:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{stat.question.questionText}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{stat.question.questionType}</Badge>
                      <Badge variant="outline">{stat.question.topic}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">
                          {stat.correctCount} students answered correctly
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-gray-700">
                          {stat.incorrectCount} students answered incorrectly
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Student Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            Individual student performance on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No student attempts yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => {
                  const student = students.find((s) => s.id === attempt.studentId);
                  const percentage = (attempt.score / attempt.maxScore) * 100;

                  return (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {student?.name || 'Unknown Student'}
                      </TableCell>
                      <TableCell>
                        {attempt.score}/{attempt.maxScore}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            percentage >= 70
                              ? 'bg-green-100 text-green-800'
                              : percentage >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {percentage.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attempt.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

