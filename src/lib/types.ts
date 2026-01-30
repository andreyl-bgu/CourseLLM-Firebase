export type Material = {
  id: string;
  title: string;
  type: 'PDF' | 'PPT' | 'DOC' | 'MD';
  content: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  imageId: string;
  materials: Material[];
  learningObjectives: string;
  learningSkills: string;
  learningTrajectories: string;
};

export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type StudentProgress = {
  studentId: string;
  courseId: string;
  progress: number;
  questionsAsked: number;
  lastAccessed: string;
};

export type EngagementData = {
  date: string;
  logins: number;
  questions: number;
};

// Quiz Types
export type QuizQuestion = {
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[]; // for multiple-choice questions
  correctAnswer: string | string[]; // can be multiple for multi-select
  explanation: string; // explanation of the correct answer
  points: number;
  topic: string;
};

export type Quiz = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdBy: string; // teacher user ID
  createdAt: string;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[]; // topics covered in this quiz
};

export type QuizAnswer = {
  questionId: string;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  courseId: string;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  startedAt: string;
  completedAt: string | null;
  status: 'in-progress' | 'completed';
};

export type QuizStatistics = {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  questionStats: {
    questionId: string;
    correctCount: number;
    incorrectCount: number;
    averagePoints: number;
  }[];
};
