'use client';

/**
 * Teacher Quiz Generation Page
 * 
 * Allows teachers to generate quizzes using AI from course content.
 * Teachers can configure quiz parameters and preview before saving.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { courses } from '@/lib/mock-data';
import { QuizApiClient } from '@/lib/quiz-api-client';
import { Quiz, QuizQuestion } from '@/lib/types';
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateQuiz } from '@/ai/flows/quiz-generation';

// Mock current teacher ID
const CURRENT_TEACHER_ID = 'teacher-1';

export default function GenerateQuizPage() {
  const router = useRouter();

  // Form state
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

    setIsGenerating(true);

    try {
      // Get course content
      const courseContent = selectedCourseData?.materials
        .map((m) => `${m.title}\n${m.content}`)
        .join('\n\n') || '';

      const learningObjectives = selectedCourseData?.learningObjectives || '';

      // Parse topics
      const topicList = topics
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Request extra questions to account for validation filtering
      // Request 80% more than needed to ensure we get the desired number after filtering
      const requestedQuestions = Math.ceil(numberOfQuestions * 1.8);
      
      // Call AI flow to generate quiz
      const result = await generateQuiz({
        courseContent,
        learningObjectives,
        numberOfQuestions: requestedQuestions,
        difficulty,
        topics: topicList.length > 0 ? topicList : undefined,
      });
      
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
        createdBy: CURRENT_TEACHER_ID,
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
                <Label htmlFor="course">Course *</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCourseData && (
                  <p className="text-sm text-gray-600">
                    {selectedCourseData.materials.length} material(s) available
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

