'use client';

/**
 * Student Quiz List Page
 * 
 * Displays all available quizzes for the student's enrolled courses.
 * Students can filter by course, difficulty, and completion status.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { courses, quizAttempts } from '@/lib/mock-data';
import { Quiz, QuizAttempt } from '@/lib/types';
import { BookOpen, Clock, Target, Trophy, Loader2 } from 'lucide-react';

// Mock current student ID (in production, get from auth)
const CURRENT_STUDENT_ID = 'student-1';

export default function StudentQuizzesPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch quizzes from Firebase
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const allQuizzes = await QuizApiClient.getAll();
        setQuizzes(allQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Get student's quiz attempts
  const studentAttempts = quizAttempts.filter(
    (attempt) => attempt.studentId === CURRENT_STUDENT_ID
  );

  // Get student's enrolled courses (mock - all courses for now)
  const enrolledCourses = courses;

  // Filter quizzes based on selected filters
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (selectedCourse !== 'all' && quiz.courseId !== selectedCourse) return false;
    if (selectedDifficulty !== 'all' && quiz.difficulty !== selectedDifficulty) return false;

    // Check completion status
    if (selectedStatus !== 'all') {
      const attempt = studentAttempts.find(
        (a) => a.quizId === quiz.id && a.status === 'completed'
      );
      if (selectedStatus === 'completed' && !attempt) return false;
      if (selectedStatus === 'not-started' && attempt) return false;
    }

    return true;
  });

  // Get quiz attempt info
  const getQuizAttemptInfo = (quizId: string): { attempted: boolean; score?: number; maxScore?: number; status?: string } => {
    const attempt = studentAttempts
      .filter((a) => a.quizId === quizId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

    if (!attempt) return { attempted: false };

    return {
      attempted: true,
      score: attempt.score,
      maxScore: attempt.maxScore,
      status: attempt.status,
    };
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#3F51B5' }}>
          Available Quizzes
        </h1>
        <p className="text-gray-600">
          Test your knowledge and track your progress across all your courses.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {enrolledCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quiz List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Loading quizzes...</p>
          </CardContent>
        </Card>
      ) : filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No quizzes found matching your filters.</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filter criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const attemptInfo = getQuizAttemptInfo(quiz.id);
            const course = courses.find((c) => c.id === quiz.courseId);
            const percentage = attemptInfo.attempted && attemptInfo.score !== undefined && attemptInfo.maxScore
              ? (attemptInfo.score / attemptInfo.maxScore) * 100
              : 0;

            return (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{quiz.title}</CardTitle>
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {course?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {quiz.description}
                  </p>

                  {/* Quiz Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>{quiz.totalPoints} points</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>~{quiz.questions.length * 2} minutes</span>
                    </div>
                  </div>

                  {/* Attempt Status */}
                  {attemptInfo.attempted && attemptInfo.status === 'completed' ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Your Score:</span>
                        <span className="font-semibold" style={{ color: '#3F51B5' }}>
                          {attemptInfo.score}/{attemptInfo.maxScore} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ) : attemptInfo.attempted && attemptInfo.status === 'in-progress' ? (
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2">In Progress</Badge>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2">Not Started</Badge>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href={`/student/quizzes/${quiz.id}`}>
                    <Button className="w-full" style={{ backgroundColor: '#3F51B5' }}>
                      {attemptInfo.attempted && attemptInfo.status === 'completed'
                        ? 'Retake Quiz'
                        : attemptInfo.attempted && attemptInfo.status === 'in-progress'
                        ? 'Continue Quiz'
                        : 'Start Quiz'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

