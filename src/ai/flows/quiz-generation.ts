'use server';

/**
 * @fileOverview Quiz generation AI flow for CourseWise.
 * 
 * This module implements the AI-powered quiz generation feature that creates
 * personalized quiz questions from course materials.
 * 
 * - generateQuiz - Main entry point for generating quizzes
 * - GenerateQuizInput - Input schema for quiz generation
 * - GenerateQuizOutput - Output schema containing generated questions
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for quiz generation
const GenerateQuizInputSchema = z.object({
  courseContent: z
    .string()
    .describe('The course material content to generate quiz questions from, including all relevant text and concepts.'),
  learningObjectives: z
    .string()
    .describe('The learning objectives for the course that questions should assess.'),
  numberOfQuestions: z
    .number()
    .min(1)
    .max(50)
    .describe('The number of questions to generate for this quiz.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the quiz questions.'),
  topics: z
    .array(z.string())
    .optional()
    .describe('Specific topics to focus on. If not provided, questions will cover all content.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Output schema for quiz generation
const QuizQuestionSchema = z.object({
  id: z.string().describe('Unique identifier for the question'),
  questionText: z.string().describe('The question text'),
  questionType: z
    .enum(['multiple-choice', 'true-false', 'short-answer'])
    .describe('The type of question'),
  options: z
    .array(z.string())
    .optional()
    .describe('Answer options for multiple-choice questions'),
  correctAnswer: z
    .union([z.string(), z.array(z.string())])
    .describe('The correct answer(s)'),
  explanation: z
    .string()
    .describe('Explanation of why this is the correct answer and how it relates to the course material'),
  points: z.number().describe('Points awarded for correct answer'),
  topic: z.string().describe('The topic this question covers'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe('Array of generated quiz questions with answers and explanations'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

/**
 * Main entry point for quiz generation
 */
export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return quizGenerationFlow(input);
}

/**
 * Function to extract key topics from course content (simplified)
 */
async function extractKeyTopics(input: {
  courseContent: string;
  learningObjectives: string;
}): Promise<string[]> {
  // For MVP, extract topics from learning objectives and simple keyword analysis
  const topics: string[] = [];
  
  // Extract from learning objectives
  const objectiveLines = input.learningObjectives.split(/[.\n]/).filter(line => line.trim().length > 0);
  objectiveLines.forEach(line => {
    // Extract meaningful phrases (simplified)
    const words = line.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      topics.push(line.trim());
    }
  });
  
  // If we don't have enough topics, add some generic ones
  if (topics.length < 3) {
    topics.push('Core Concepts', 'Key Principles', 'Practical Application');
  }
  
  // Return first 5 topics
  return topics.slice(0, 5);
}

/**
 * Function to validate question quality (not an AI tool)
 */
function validateQuestionQuality(question: z.infer<typeof QuizQuestionSchema>): {
  isValid: boolean;
  reason: string;
} {
  // Check question length
  if (question.questionText.length < 10) {
    return {
      isValid: false,
      reason: 'Question text is too short',
    };
  }

  // Check for multiple-choice options
  if (question.questionType === 'multiple-choice' && (!question.options || question.options.length < 2)) {
    return {
      isValid: false,
      reason: 'Multiple-choice questions must have at least 2 options',
    };
  }

  // Check for explanation (relaxed to 10 characters)
  if (!question.explanation || question.explanation.length < 10) {
    return {
      isValid: false,
      reason: 'Question must have a meaningful explanation',
    };
  }

  // Check for correct answer
  if (!question.correctAnswer || (typeof question.correctAnswer === 'string' && question.correctAnswer.length === 0)) {
    return {
      isValid: false,
      reason: 'Question must have a correct answer specified',
    };
  }

  // All checks passed
  return {
    isValid: true,
    reason: 'Question meets all quality criteria',
  };
}

/**
 * Main quiz generation prompt
 */
const quizPrompt = ai.definePrompt({
  name: 'quizGenerationPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert educational assessment creator specializing in generating high-quality quiz questions from course materials.

Your task is to generate {{numberOfQuestions}} quiz questions at {{difficulty}} difficulty level based on the provided course content and learning objectives.

**Course Content:**
{{courseContent}}

**Learning Objectives:**
{{learningObjectives}}

{{#if topics}}
**Focus Topics:**
{{#each topics}}
- {{this}}
{{/each}}
{{/if}}

**Requirements:**
1. Questions MUST be directly based on the provided course content - do not add information not present in the materials
2. Include a mix of question types:
   - Multiple-choice (4 options each): ~60% of questions
   - True-false: ~20% of questions
   - Short-answer: ~20% of questions
3. For {{difficulty}} difficulty:
   - easy: Focus on definitions, basic concepts, and recall
   - medium: Require understanding and application of concepts
   - hard: Require analysis, synthesis, and critical thinking
4. Each question must include:
   - Clear, unambiguous question text
   - For multiple-choice: 4 plausible options with only one correct answer
   - For true-false: A clear statement that is definitively true or false
   - For short-answer: A question that has a specific, verifiable answer
   - A detailed explanation that references the course material
   - Point value (easy: 1-2 points, medium: 3-4 points, hard: 5-6 points)
   - The topic from the course material it covers
5. Ensure questions test understanding, not just memorization
6. Avoid ambiguous or trick questions
7. Make all answer options (for multiple-choice) plausible but clearly distinguishable

Generate the questions in JSON format with the following structure for each question:
{
  "id": "q1", "q2", etc.
  "questionText": "The question text",
  "questionType": "multiple-choice" | "true-false" | "short-answer",
  "options": ["option1", "option2", "option3", "option4"], // for multiple-choice only
  "correctAnswer": "the correct answer" or ["answer1", "answer2"], // array for multi-select if needed
  "explanation": "Detailed explanation referencing course material",
  "points": 1-6 based on difficulty,
  "topic": "The specific topic from course content"
}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

/**
 * Quiz generation flow
 */
const quizGenerationFlow = ai.defineFlow(
  {
    name: 'quizGenerationFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    console.log('[Quiz Generation] Starting quiz generation...');
    console.log(`[Quiz Generation] Parameters: ${input.numberOfQuestions} questions, ${input.difficulty} difficulty`);

    try {
      // Step 1: Extract key topics if not provided
      let topics = input.topics;
      if (!topics || topics.length === 0) {
        console.log('[Quiz Generation] Extracting key topics...');
        topics = await extractKeyTopics({
          courseContent: input.courseContent,
          learningObjectives: input.learningObjectives,
        });
        console.log(`[Quiz Generation] Extracted topics: ${topics.join(', ')}`);
      }

      // Step 2: Generate questions using AI
      console.log('[Quiz Generation] Generating questions with AI...');
      const {output} = await quizPrompt({
        ...input,
        topics,
      });

      if (!output || !output.questions || output.questions.length === 0) {
        throw new Error('AI failed to generate any questions');
      }

      console.log(`[Quiz Generation] Generated ${output.questions.length} questions`);

      // Step 3: Validate each question
      console.log('[Quiz Generation] Validating question quality...');
      const validatedQuestions = output.questions.map((question, index) => {
        const validation = validateQuestionQuality(question);

        if (!validation.isValid) {
          console.warn(`[Quiz Generation] Question ${index + 1} failed validation: ${validation.reason}`);
          return null;
        }

        return question;
      });

      // Filter out invalid questions
      const validQuestions = validatedQuestions.filter((q): q is NonNullable<typeof q> => q !== null);

      console.log(`[Quiz Generation] ${validQuestions.length} questions passed validation`);

      if (validQuestions.length === 0) {
        throw new Error('No questions passed validation. Please check course content and try again.');
      }

      // If we lost too many questions, warn the user
      if (validQuestions.length < input.numberOfQuestions * 0.5) {
        console.warn(
          `[Quiz Generation] Warning: Only ${validQuestions.length} of ${input.numberOfQuestions} requested questions passed validation`
        );
      }

      return {questions: validQuestions};
    } catch (error) {
      console.error('[Quiz Generation] Error generating quiz:', error);
      throw new Error(
        `Unable to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your course content and try again.`
      );
    }
  }
);

