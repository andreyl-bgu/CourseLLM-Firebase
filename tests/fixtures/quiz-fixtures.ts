/**
 * Test fixtures and mock data for quiz tests
 * Based on mock data from src/lib/mock-data.ts
 */

export const QUIZ_FIXTURES = {
  courses: {
    python: {
      id: 'cs101',
      title: 'Introduction to Python',
    },
    dataStructures: {
      id: 'cs202',
      title: 'Data Structures & Algorithms',
    },
    machineLearning: {
      id: 'cs303',
      title: 'Machine Learning Foundations',
    },
  },
  
  quizzes: {
    pythonBasics: {
      id: 'quiz-1',
      title: 'Python Basics Quiz',
      courseId: 'cs101',
      difficulty: 'easy',
      questionCount: 4,
      totalPoints: 10,
    },
    controlFlow: {
      id: 'quiz-2',
      title: 'Control Flow Mastery',
      courseId: 'cs101',
      difficulty: 'medium',
      questionCount: 5,
      totalPoints: 15,
    },
    arraysComplexity: {
      id: 'quiz-3',
      title: 'Arrays and Complexity Analysis',
      courseId: 'cs202',
      difficulty: 'hard',
      questionCount: 5,
      totalPoints: 20,
    },
  },

  students: {
    alex: {
      id: 'student-1',
      name: 'Alex Johnson',
    },
    maria: {
      id: 'student-2',
      name: 'Maria Garcia',
    },
    james: {
      id: 'student-3',
      name: 'James Smith',
    },
  },

  quizGeneration: {
    defaultConfig: {
      course: 'Introduction to Python',
      title: 'E2E Test Quiz - Python Basics',
      description: 'Test quiz generated for E2E testing',
      numberOfQuestions: 5,
      difficulty: 'medium' as const,
      topics: 'Variables, Data Types, Syntax',
    },
    minimalConfig: {
      course: 'Introduction to Python',
      title: 'Minimal Test Quiz',
      numberOfQuestions: 3,
      difficulty: 'easy' as const,
    },
  },

  quizAnswers: {
    pythonBasics: {
      q1: 'print("Hello, World!")', // multiple-choice
      q2: 'False', // true-false
      q3: 'char', // multiple-choice
      q4: 'def', // short-answer
    },
  },
};

/**
 * Helper to get quiz by title
 */
export function getQuizByTitle(title: string) {
  return Object.values(QUIZ_FIXTURES.quizzes).find(q => q.title === title);
}

/**
 * Helper to get course by title
 */
export function getCourseByTitle(title: string) {
  return Object.values(QUIZ_FIXTURES.courses).find(c => c.title === title);
}

