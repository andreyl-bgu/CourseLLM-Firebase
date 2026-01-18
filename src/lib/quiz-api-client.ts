/**
 * Quiz API Client
 * 
 * A client for the Quiz Service REST API.
 * When NEXT_PUBLIC_QUIZ_SERVICE_URL is set, calls go to an external service.
 * Otherwise, calls go to the local Next.js API routes.
 */

import { Quiz, QuizAttempt } from './types';

// Base URL for the Quiz Service API
// Empty string means use local API routes (same server)
const API_BASE = process.env.NEXT_PUBLIC_QUIZ_SERVICE_URL || '';

/**
 * Quiz API Client - mirrors FirebaseQuizService interface
 */
export const QuizApiClient = {
  // ============ Quiz Operations ============

  /**
   * Get all quizzes
   */
  async getAll(): Promise<Quiz[]> {
    // #region agent log
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quiz-api-client.ts:24',message:'QuizApiClient.getAll called',data:{apiBase:API_BASE,url:`${API_BASE}/api/quizzes`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    const res = await fetch(`${API_BASE}/api/quizzes`);
    // #region agent log
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test' && res) {
      const ok = res.ok;
      const status = res.status;
      const statusText = res.statusText;
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quiz-api-client.ts:30',message:'Fetch response received',data:{ok,status,statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    if (!res.ok) {
      // #region agent log
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quiz-api-client.ts:30',message:'Fetch failed',data:{status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      throw new Error(`Failed to fetch quizzes: ${res.statusText}`);
    }
    const data = await res.json();
    // #region agent log
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quiz-api-client.ts:34',message:'QuizApiClient.getAll result',data:{count:Array.isArray(data)?data.length:0,isEmpty:!Array.isArray(data)||data.length===0,isArray:Array.isArray(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    return data;
  },

  /**
   * Get quiz by ID
   */
  async getById(id: string): Promise<Quiz | null> {
    const res = await fetch(`${API_BASE}/api/quizzes/${id}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch quiz: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get quizzes by course ID
   */
  async getByCourse(courseId: string): Promise<Quiz[]> {
    const res = await fetch(`${API_BASE}/api/quizzes?courseId=${encodeURIComponent(courseId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch quizzes by course: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get quizzes by teacher ID
   */
  async getByTeacher(teacherId: string): Promise<Quiz[]> {
    const res = await fetch(`${API_BASE}/api/quizzes?teacherId=${encodeURIComponent(teacherId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch quizzes by teacher: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Create a new quiz
   */
  async add(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    const res = await fetch(`${API_BASE}/api/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    if (!res.ok) {
      // Try to get error message from response
      let errorMessage = res.statusText;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use statusText
      }
      throw new Error(`Failed to create quiz: ${errorMessage}`);
    }
    return res.json();
  },

  /**
   * Update a quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const res = await fetch(`${API_BASE}/api/quizzes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      throw new Error(`Failed to update quiz: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Delete a quiz
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/quizzes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete quiz: ${res.statusText}`);
    }
  },

  // ============ Attempt Operations ============

  /**
   * Get all attempts for a quiz
   */
  async getAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    const res = await fetch(`${API_BASE}/api/attempts?quizId=${encodeURIComponent(quizId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch attempts by quiz: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get all attempts by a student
   */
  async getAttemptsByStudent(studentId: string): Promise<QuizAttempt[]> {
    const res = await fetch(`${API_BASE}/api/attempts?studentId=${encodeURIComponent(studentId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch attempts by student: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get a student's attempt for a specific quiz
   */
  async getStudentAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
    const res = await fetch(
      `${API_BASE}/api/attempts?quizId=${encodeURIComponent(quizId)}&studentId=${encodeURIComponent(studentId)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch student attempt: ${res.statusText}`);
    }
    const attempts = await res.json();
    return attempts[0] || null;
  },

  /**
   * Get attempt by ID
   */
  async getAttemptById(id: string): Promise<QuizAttempt | null> {
    const res = await fetch(`${API_BASE}/api/attempts/${id}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch attempt: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Create a new attempt
   */
  async createAttempt(attempt: Omit<QuizAttempt, 'id' | 'startedAt' | 'completedAt'>): Promise<QuizAttempt> {
    const res = await fetch(`${API_BASE}/api/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
    });
    if (!res.ok) {
      throw new Error(`Failed to create attempt: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Update an attempt
   */
  async updateAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const res = await fetch(`${API_BASE}/api/attempts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      throw new Error(`Failed to update attempt: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Delete an attempt
   */
  async deleteAttempt(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/attempts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete attempt: ${res.statusText}`);
    }
  },
};

