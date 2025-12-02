'use client';

/**
 * Teacher Quiz Results Page
 * 
 * Displays all student attempts for a specific quiz with detailed results
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { courses, students } from '@/lib/mock-data';
import { Quiz, QuizAttempt } from '@/lib/types';
import { ArrowLeft, Users, Trophy, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function QuizResultsPage() {
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
        
        // Fetch quiz and attempts from API
        const [foundQuiz, foundAttempts] = await Promise.all([
          QuizApiClient.getById(quizId),
          QuizApiClient.getAttemptsByQuiz(quizId)
        ]);
        
        setQuiz(foundQuiz || null);
        
        // Filter only completed attempts
        const completedAttempts = foundAttempts.filter(a => a.status === 'completed');
        setAttempts(completedAttempts);
      } catch (error) {
        console.error('Error fetching quiz results:', error);
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
            <p className="text-gray-600 text-lg">Loading results...</p>
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
  const averageScore = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / totalAttempts
    : 0;
  const highestScore = totalAttempts > 0
    ? Math.max(...attempts.map(a => (a.score / a.maxScore) * 100))
    : 0;
  const lowestScore = totalAttempts > 0
    ? Math.min(...attempts.map(a => (a.score / a.maxScore) * 100))
    : 0;

  // Get student info (mock - in production, fetch from Firebase)
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  // Get performance color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto py-8 px-4">
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
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#3F51B5' }}>
              {quiz.title} - Student Results
            </h1>
            <p className="text-gray-600">
              {course?.title} • {quiz.questions.length} questions • {quiz.totalPoints} points
            </p>
          </div>
          <Badge className={getScoreBadgeColor(averageScore)}>
            {quiz.difficulty}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
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
                <p className="text-sm text-gray-600">Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(0)}%
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
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {highestScore.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lowest Score</p>
                <p className="text-3xl font-bold text-red-600">
                  {lowestScore.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400 transform rotate-180" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            {totalAttempts === 0
              ? 'No students have completed this quiz yet.'
              : `${totalAttempts} student${totalAttempts !== 1 ? 's' : ''} completed this quiz.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalAttempts === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                Results will appear here once students complete the quiz.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Correct Answers</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => {
                    const percentage = (attempt.score / attempt.maxScore) * 100;
                    const correctCount = attempt.answers.filter(a => a.isCorrect).length;
                    const totalQuestions = attempt.answers.length;

                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          {getStudentName(attempt.studentId)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(percentage)}`}>
                            {attempt.score} / {attempt.maxScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getScoreBadgeColor(percentage)}>
                            {percentage.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>
                              {correctCount} / {totalQuestions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="w-full max-w-[120px]">
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

