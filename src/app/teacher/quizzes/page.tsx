'use client';

/**
 * Teacher Quiz Management Page
 * 
 * Displays all quizzes created by the teacher with options to:
 * - Generate new quizzes
 * - View quiz details and statistics
 * - Edit or delete quizzes
 * - View student attempts
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProviderClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Quiz, Course, QuizAttempt } from '@/lib/types';
import { Plus, BarChart, Users, Trophy, BookOpen, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TeacherQuizzesPage() {
  const { firebaseUser } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch quizzes, attempts, and courses from Firebase
  const fetchData = async () => {
    if (!firebaseUser?.uid) return;
    
    try {
      setIsLoading(true);
      
      // Fetch quizzes, attempts, and courses in parallel
      const [quizzes, coursesResponse] = await Promise.all([
        QuizApiClient.getByTeacher(firebaseUser.uid),
        fetch(`/api/courses?teacherId=${firebaseUser.uid}`).then(res => res.ok ? res.json() : [])
      ]);
      
      setAllQuizzes(quizzes);
      setTeacherCourses(coursesResponse);
      
      // Fetch attempts for all quizzes
      const quizIds = quizzes.map(q => q.id);
      const attemptsPromises = quizIds.map(quizId => 
        QuizApiClient.getAttemptsByQuiz(quizId).catch(() => [])
      );
      
      const allAttemptsArrays = await Promise.all(attemptsPromises);
      const flatAttempts = allAttemptsArrays.flat();
      
      console.log('[TeacherQuizzes] Fetched data:', {
        quizzes: quizzes.length,
        courses: coursesResponse.length,
        attempts: flatAttempts.length,
        teacherId: firebaseUser.uid
      });
      
      setAllAttempts(flatAttempts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [firebaseUser]);

  // Handle delete quiz
  const handleDeleteClick = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;

    try {
      setIsDeleting(true);
      await QuizApiClient.delete(quizToDelete.id);
      
      toast({
        title: 'Quiz Deleted',
        description: `"${quizToDelete.title}" has been permanently deleted.`,
      });

      // Refresh the quiz list
      await fetchData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    }
  };

  // Filter quizzes by course and difficulty (createdBy is already filtered by API)
  const teacherQuizzes = allQuizzes.filter((quiz) => {
    if (selectedCourse !== 'all' && quiz.courseId !== selectedCourse) return false;
    if (selectedDifficulty !== 'all' && quiz.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // Get quiz statistics from real attempts
  const getQuizStats = (quizId: string) => {
    const attempts = allAttempts.filter((a) => a.quizId === quizId && a.status === 'completed');
    const totalAttempts = attempts.length;
    
    if (totalAttempts === 0) {
      return { totalAttempts: 0, averageScore: 0, completionRate: 0 };
    }

    // Calculate average score percentage
    const totalPercentage = attempts.reduce((sum, a) => {
      const percentage = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
      return sum + percentage;
    }, 0);
    const averageScore = totalPercentage / totalAttempts;

    // Calculate completion rate (completed attempts / all attempts for this quiz)
    const allQuizAttempts = allAttempts.filter((a) => a.quizId === quizId);
    const completedAttempts = allQuizAttempts.filter((a) => a.status === 'completed').length;
    const completionRate = allQuizAttempts.length > 0 
      ? (completedAttempts / allQuizAttempts.length) * 100 
      : 0;

    return {
      totalAttempts,
      averageScore,
      completionRate,
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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#3F51B5' }}>
            Quiz Management
          </h1>
          <p className="text-gray-600">
            Create and manage quizzes for your courses
          </p>
        </div>
        <Link href="/teacher/quizzes/generate">
          <Button size="lg" style={{ backgroundColor: '#3F51B5' }}>
            <Plus className="h-5 w-5 mr-2" />
            Generate Quiz
          </Button>
        </Link>
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
              {teacherCourses.map((course) => (
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
      </div>

      {/* Quiz List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Loading quizzes...</p>
          </CardContent>
        </Card>
      ) : teacherQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No quizzes found.</p>
            <p className="text-gray-500 text-sm mb-6">
              Create your first quiz to start assessing your students.
            </p>
            <Link href="/teacher/quizzes/generate">
              <Button style={{ backgroundColor: '#3F51B5' }}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {teacherQuizzes.map((quiz) => {
            const course = teacherCourses.find((c) => c.id === quiz.courseId);
            const stats = getQuizStats(quiz.id);

            return (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>
                        {course?.title || 'Unknown Course'} • {quiz.questions.length} questions • {quiz.totalPoints} points
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{quiz.description}</p>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.topics.map((topic, index) => (
                      <Badge key={index} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#3F51B5' }}>
                        {stats.totalAttempts}
                      </div>
                      <div className="text-xs text-gray-600">Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Trophy className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#3F51B5' }}>
                        {stats.averageScore.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#3F51B5' }}>
                        {stats.completionRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Completion</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/teacher/quizzes/${quiz.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <BarChart className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/teacher/quizzes/${quiz.id}/results`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Student Results
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(quiz)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{quizToDelete?.title}"</strong>?
              <br /><br />
              This action cannot be undone. The quiz and all associated student attempts will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Quiz
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
