/**
 * In-memory quiz store for session persistence
 * In production, this would be replaced with Firebase operations
 */

import { Quiz } from './types';
import { quizzes as initialQuizzes } from './mock-data';

// In-memory store for quizzes (persists during session)
let quizStore: Quiz[] = [...initialQuizzes];

export const QuizStore = {
  /**
   * Get all quizzes
   */
  getAll(): Quiz[] {
    return [...quizStore];
  },

  /**
   * Get quiz by ID
   */
  getById(id: string): Quiz | undefined {
    return quizStore.find(q => q.id === id);
  },

  /**
   * Get quizzes by course ID
   */
  getByCourse(courseId: string): Quiz[] {
    return quizStore.filter(q => q.courseId === courseId);
  },

  /**
   * Get quizzes by teacher ID
   */
  getByTeacher(teacherId: string): Quiz[] {
    return quizStore.filter(q => q.createdBy === teacherId);
  },

  /**
   * Add a new quiz
   */
  add(quiz: Quiz): Quiz {
    quizStore.push(quiz);
    console.log(`[QuizStore] Added quiz: ${quiz.id} - "${quiz.title}" (${quiz.questions.length} questions)`);
    return quiz;
  },

  /**
   * Update an existing quiz
   */
  update(id: string, updates: Partial<Quiz>): Quiz | null {
    const index = quizStore.findIndex(q => q.id === id);
    if (index === -1) return null;
    
    quizStore[index] = { ...quizStore[index], ...updates };
    return quizStore[index];
  },

  /**
   * Delete a quiz
   */
  delete(id: string): boolean {
    const index = quizStore.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    quizStore.splice(index, 1);
    return true;
  },

  /**
   * Reset to initial mock data (for testing)
   */
  reset(): void {
    quizStore = [...initialQuizzes];
  },
};

