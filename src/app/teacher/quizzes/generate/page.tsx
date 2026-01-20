'use client';

/**
 * Teacher Quiz Generation Page
 * 
 * Allows teachers to generate quizzes using AI from course content.
 * Teachers can configure quiz parameters and preview before saving.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProviderClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { Quiz, QuizQuestion, Course } from '@/lib/types';
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Quiz generation is now handled via API route

export default function GenerateQuizPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  // Form state
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [quizDescription, setQuizDescription] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [topics, setTopics] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch courses from Firebase
  useEffect(() => {
    const fetchCourses = async () => {
      console.log('[QuizGenerate] useEffect triggered, firebaseUser:', firebaseUser?.uid || 'null');
      
      if (!firebaseUser?.uid) {
        console.log('[QuizGenerate] No firebaseUser.uid, skipping fetch');
        setIsLoadingCourses(false);
        return;
      }
      
      console.log('[QuizGenerate] Starting fetch for teacherId:', firebaseUser.uid);
      setIsLoadingCourses(true);
      
      try {
        const url = `/api/courses?teacherId=${firebaseUser.uid}`;
        console.log('[QuizGenerate] Fetching from:', url);
        
        const response = await fetch(url);
        console.log('[QuizGenerate] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[QuizGenerate] Response error:', response.status, errorText);
          throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[QuizGenerate] Fetched courses response:', {
          isArray: Array.isArray(data),
          count: Array.isArray(data) ? data.length : 0,
          data: data,
          teacherId: firebaseUser.uid
        });
        
        // Ensure we have an array and filter out any invalid courses
        const validCourses = Array.isArray(data) 
          ? data.filter(c => {
              const isValid = c && c.id && c.title;
              if (!isValid) {
                console.warn('[QuizGenerate] Invalid course filtered out:', c);
              }
              return isValid;
            })
          : [];
        
        console.log('[QuizGenerate] Valid courses after filtering:', {
          count: validCourses.length,
          courses: validCourses.map(c => ({ id: c.id, title: c.title }))
        });
        
        setCourses(validCourses);
        
        if (validCourses.length === 0) {
          console.warn('[QuizGenerate] No valid courses found for teacher:', firebaseUser.uid);
        }
      } catch (error) {
        console.error('[QuizGenerate] Error fetching courses:', error);
        console.error('[QuizGenerate] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load courses. Please try again.',
          variant: 'destructive',
        });
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [firebaseUser, toast]);

  // Get selected course
  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  // Handle quiz generation
  const handleGenerate = async () => {
    if (!selectedCourse) {
      toast({
        title: 'Course Required',
        description: 'Please select a course to generate quiz from.',
        variant: 'destructive',
      });
      return;
    }

    if (!quizTitle.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your quiz.',
        variant: 'destructive',
      });
      return;
    }

    // Validate course has content
    if (!selectedCourseData) {
      toast({
        title: 'Course Not Found',
        description: 'The selected course could not be found. Please select a different course.',
        variant: 'destructive',
      });
      return;
    }

    // Get course content from materials if available
    const materials = selectedCourseData?.materials || [];
    const materialsContent = materials
      .map((m) => `${m.title}\n${m.content}`)
      .join('\n\n') || '';

    const learningObjectives = selectedCourseData?.learningObjectives || '';

    console.log('[QuizGenerate] Course selected:', selectedCourseData?.title);
    console.log('[QuizGenerate] Materials count:', materials.length);
    console.log('[QuizGenerate] Materials content length:', materialsContent.length);

    // Build course content for AI generation
    // If materials exist, use them; otherwise, use course metadata as fallback
    let finalCourseContent = '';
    let finalLearningObjectives = '';

    if (materialsContent.trim() && materials.length > 0) {
      // Use uploaded materials
      finalCourseContent = materialsContent.trim();
      finalLearningObjectives = learningObjectives.trim() || 
        `Assess understanding of ${selectedCourseData.title} concepts and principles.`;
      
      console.log('[QuizGenerate] Using course materials for quiz generation:', materials.length, 'materials');
    } else {
      // No materials - use course metadata as content for AI generation
      const courseTitle = selectedCourseData?.title || '';
      const courseDescription = selectedCourseData?.description || '';
      const courseSkills = selectedCourseData?.learningSkills || '';
      const courseTrajectories = selectedCourseData?.learningTrajectories || '';

      // Build content from course metadata
      const courseMetadata = [
        courseTitle && `Course: ${courseTitle}`,
        courseDescription && `Description: ${courseDescription}`,
        learningObjectives && `Learning Objectives: ${learningObjectives}`,
        courseSkills && `Skills: ${courseSkills}`,
        courseTrajectories && `Learning Path: ${courseTrajectories}`,
      ].filter(Boolean).join('\n\n');

      finalCourseContent = courseMetadata || `Course content for ${courseTitle || 'this course'}`;
      finalLearningObjectives = learningObjectives.trim() || 
        `Assess understanding of ${courseTitle || 'course'} concepts and principles based on the quiz title and topics specified.`;
      
      console.log('[QuizGenerate] Using course metadata as fallback (no materials available)');
    }

    setIsGenerating(true);

    try {
      // Parse topics
      const topicList = topics
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Request extra questions to account for validation filtering
      // Request 80% more than needed to ensure we get the desired number after filtering
      const requestedQuestions = Math.ceil(numberOfQuestions * 1.8);
      
      console.log('[QuizGenerate] Sending request with:', {
        courseContentLength: finalCourseContent.length,
        learningObjectivesLength: finalLearningObjectives.length,
        numberOfQuestions: requestedQuestions,
        difficulty,
        topics: topicList
      });
      
      // Call API route to generate quiz
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseContent: finalCourseContent,
          learningObjectives: finalLearningObjectives,
          numberOfQuestions: requestedQuestions,
          difficulty,
          topics: topicList.length > 0 ? topicList : undefined,
          quizTitle: quizTitle, // Pass quiz title to help AI understand context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate quiz');
      }

      const result = await response.json();
      
      // If we got fewer questions than requested, warn the user
      if (result.questions.length < numberOfQuestions) {
        console.warn(`Only generated ${result.questions.length} of ${numberOfQuestions} requested questions`);
      }
      
      // Trim to requested number if we got more, otherwise use what we have
      const trimmedQuestions = result.questions.slice(0, numberOfQuestions);

      setGeneratedQuestions(trimmedQuestions);
      setShowPreview(true);

      // Show appropriate toast message
      if (trimmedQuestions.length < numberOfQuestions) {
        toast({
          title: 'Quiz Generated (Partial)',
          description: `Generated ${trimmedQuestions.length} of ${numberOfQuestions} requested questions. Some questions were filtered out due to quality issues. You can regenerate or save these questions.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Quiz Generated!',
          description: `Successfully generated ${trimmedQuestions.length} questions.`,
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save quiz
  const handleSave = async () => {
    if (generatedQuestions.length === 0) {
      toast({
        title: 'No Questions',
        description: 'Please generate questions before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Calculate total points
      const totalPoints = generatedQuestions.reduce((sum, q) => sum + q.points, 0);

      // Extract unique topics
      const uniqueTopics = [...new Set(generatedQuestions.map((q) => q.topic))];

      // Create quiz object (without id and createdAt - Firebase will generate these)
      const quizData = {
        courseId: selectedCourse,
        title: quizTitle,
        description: quizDescription,
        questions: generatedQuestions,
        createdBy: firebaseUser?.uid || '',
        totalPoints,
        difficulty,
        topics: uniqueTopics,
      };

      // Save quiz to API
      const savedQuiz = await QuizApiClient.add(quizData);

      toast({
        title: 'Quiz Saved!',
        description: `Your quiz "${savedQuiz.title}" has been created with ${savedQuiz.questions.length} questions.`,
      });

      // Redirect to quiz management page
      router.push('/teacher/quizzes');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save quiz. Please try again.',
        variant: 'destructive',
      });
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
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#3F51B5' }}>
          Generate Quiz with AI
        </h1>
        <p className="text-gray-600">
          Create personalized quizzes from your course materials using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
              <CardDescription>
                Set parameters for your AI-generated quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="course">Course *</Label>
                  {!isLoadingCourses && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!firebaseUser?.uid) return;
                        setIsLoadingCourses(true);
                        try {
                          const response = await fetch(`/api/courses?teacherId=${firebaseUser.uid}`);
                          if (!response.ok) {
                            throw new Error('Failed to fetch courses');
                          }
                          const data = await response.json();
                          const validCourses = Array.isArray(data) 
                            ? data.filter(c => c && c.id && c.title)
                            : [];
                          setCourses(validCourses);
                          console.log('[QuizGenerate] Refreshed courses:', validCourses.length);
                        } catch (error) {
                          console.error('Error refreshing courses:', error);
                        } finally {
                          setIsLoadingCourses(false);
                        }
                      }}
                    >
                      <Loader2 className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  )}
                </div>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoadingCourses}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : `Select a course (${courses.length} available)`} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <div className="p-2 text-sm text-gray-500">Loading courses...</div>
                    ) : courses.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No courses available. <a href="/teacher/courses" className="text-blue-600 underline">Create a course first</a>.
                      </div>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title || `Course ${course.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedCourseData && (
                  <p className="text-sm text-gray-600">
                    {selectedCourseData.materials?.length || 0} material(s) available
                  </p>
                )}
                {courses.length > 0 && !isLoadingCourses && (
                  <p className="text-xs text-gray-500">
                    {courses.length} course{courses.length !== 1 ? 's' : ''} loaded
                  </p>
                )}
                {courses.length === 0 && !isLoadingCourses && (
                  <p className="text-sm text-blue-600">
                    <a href="/teacher/courses" className="underline">Create a course</a> to generate quizzes.
                  </p>
                )}
              </div>

              {/* Quiz Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g., Python Fundamentals Quiz"
                />
              </div>

              {/* Quiz Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Briefly describe what this quiz covers..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Number of Questions */}
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min="1"
                  max="50"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-gray-600">
                  Recommended: 5-15 questions
                </p>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic recall and understanding</SelectItem>
                    <SelectItem value="medium">Medium - Application and analysis</SelectItem>
                    <SelectItem value="hard">Hard - Synthesis and evaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topics */}
              <div className="space-y-2">
                <Label htmlFor="topics">Specific Topics (Optional)</Label>
                <Input
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g., Variables, Loops, Functions (comma-separated)"
                />
                <p className="text-sm text-gray-600">
                  Leave empty to cover all course content
                </p>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedCourse || !quizTitle}
                style={{ backgroundColor: '#3F51B5' }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Quiz with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div>
          {showPreview && generatedQuestions.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quiz Preview</CardTitle>
                    <CardDescription>
                      Review generated questions before saving
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {generatedQuestions.length} questions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">{quizTitle}</h3>
                  {quizDescription && (
                    <p className="text-sm text-gray-600 mb-2">{quizDescription}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {generatedQuestions.reduce((sum, q) => sum + q.points, 0)} total points
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {difficulty}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Questions List */}
                <Accordion type="single" collapsible className="w-full">
                  {generatedQuestions.map((question, index) => (
                    <AccordionItem key={question.id} value={`question-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-semibold">Q{index + 1}:</span>
                          <span className="flex-1 line-clamp-1">
                            {question.questionText}
                          </span>
                          <Badge variant="outline">{question.points}pts</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div>
                            <p className="font-semibold mb-1">Question:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{question.questionText}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{question.questionType}</Badge>
                            <Badge variant="outline">{question.topic}</Badge>
                          </div>
                          {question.options && question.options.length > 0 && (
                            <div>
                              <p className="font-semibold mb-1">Options:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {question.options.map((option, i) => (
                                  <li key={i} className="text-gray-700">{option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold mb-1">Correct Answer:</p>
                            <p className="text-green-700 font-medium">
                              {Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.join(', ')
                                : question.correctAnswer}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Explanation:</p>
                            <p className="text-gray-700">{question.explanation}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <Separator className="my-4" />

                {/* Save Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSave}
                  style={{ backgroundColor: '#3F51B5' }}
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">
                  Configure your quiz and click Generate
                </p>
                <p className="text-gray-500 text-sm">
                  AI will analyze your course materials and create personalized questions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

