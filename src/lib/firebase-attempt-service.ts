/**
 * Firebase Firestore service for Quiz Attempt operations
 * Handles CRUD operations for quiz attempts in Firebase
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { QuizAttempt } from './types';

const ATTEMPTS_COLLECTION = 'quiz_attempts';

/**
 * Convert Firebase Timestamp to ISO string
 */
function timestampToISO(timestamp: any): string {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Convert QuizAttempt to Firestore format
 */
function attemptToFirestore(attempt: Omit<QuizAttempt, 'id'>): any {
  return {
    ...attempt,
    startedAt: serverTimestamp(),
    completedAt: attempt.status === 'completed' ? serverTimestamp() : null,
  };
}

/**
 * Convert Firestore document to QuizAttempt
 */
function firestoreToAttempt(id: string, data: any): QuizAttempt {
  return {
    ...data,
    id,
    startedAt: timestampToISO(data.startedAt),
    completedAt: data.completedAt ? timestampToISO(data.completedAt) : undefined,
  } as QuizAttempt;
}

export const FirebaseAttemptService = {
  /**
   * Get all attempts for a quiz
   */
  async getByQuiz(quizId: string): Promise<QuizAttempt[]> {
    try {
      const q = query(
        collection(db, ATTEMPTS_COLLECTION),
        where('quizId', '==', quizId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const attempts = querySnapshot.docs.map(doc => 
        firestoreToAttempt(doc.id, doc.data())
      );
      
      // Sort in memory instead of using orderBy (to avoid index requirement)
      return attempts.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    } catch (error) {
      console.error('[FirebaseAttemptService] Error getting attempts by quiz:', error);
      throw error;
    }
  },

  /**
   * Get all attempts by a student
   */
  async getByStudent(studentId: string): Promise<QuizAttempt[]> {
    try {
      const q = query(
        collection(db, ATTEMPTS_COLLECTION),
        where('studentId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const attempts = querySnapshot.docs.map(doc => 
        firestoreToAttempt(doc.id, doc.data())
      );
      
      // Sort in memory instead of using orderBy (to avoid index requirement)
      return attempts.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    } catch (error) {
      console.error('[FirebaseAttemptService] Error getting attempts by student:', error);
      throw error;
    }
  },

  /**
   * Get attempt by ID
   */
  async getById(attemptId: string): Promise<QuizAttempt | null> {
    try {
      const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return firestoreToAttempt(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('[FirebaseAttemptService] Error getting attempt by ID:', error);
      throw error;
    }
  },

  /**
   * Get student's attempt for a specific quiz
   */
  async getStudentAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
    try {
      const q = query(
        collection(db, ATTEMPTS_COLLECTION),
        where('quizId', '==', quizId),
        where('studentId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const attempts = querySnapshot.docs.map(doc => 
        firestoreToAttempt(doc.id, doc.data())
      );
      
      // Sort and return the most recent attempt
      attempts.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      
      return attempts[0];
    } catch (error) {
      console.error('[FirebaseAttemptService] Error getting student attempt:', error);
      throw error;
    }
  },

  /**
   * Create a new attempt
   */
  async create(attempt: Omit<QuizAttempt, 'id' | 'startedAt' | 'completedAt'>): Promise<QuizAttempt> {
    try {
      const attemptData = attemptToFirestore(attempt as Omit<QuizAttempt, 'id'>);
      const docRef = await addDoc(collection(db, ATTEMPTS_COLLECTION), attemptData);
      
      console.log(`[FirebaseAttemptService] Created attempt: ${docRef.id}`);
      
      return {
        ...attempt,
        id: docRef.id,
        startedAt: new Date().toISOString(),
        completedAt: attempt.status === 'completed' ? new Date().toISOString() : undefined,
      } as QuizAttempt;
    } catch (error) {
      console.error('[FirebaseAttemptService] Error creating attempt:', error);
      throw error;
    }
  },

  /**
   * Update an attempt (e.g., to mark as completed)
   */
  async update(attemptId: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    try {
      const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
      
      // Remove id and timestamp fields from updates
      const { id: _, startedAt, completedAt, ...updateData } = updates as any;
      
      // If marking as completed, set completedAt
      if (updates.status === 'completed') {
        updateData.completedAt = serverTimestamp();
      }
      
      await updateDoc(docRef, updateData);
      
      console.log(`[FirebaseAttemptService] Updated attempt: ${attemptId}`);
      
      // Fetch and return updated attempt
      const updated = await this.getById(attemptId);
      if (!updated) {
        throw new Error('Attempt not found after update');
      }
      
      return updated;
    } catch (error) {
      console.error('[FirebaseAttemptService] Error updating attempt:', error);
      throw error;
    }
  },

  /**
   * Delete an attempt
   */
  async delete(attemptId: string): Promise<void> {
    try {
      const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
      await deleteDoc(docRef);
      
      console.log(`[FirebaseAttemptService] Deleted attempt: ${attemptId}`);
    } catch (error) {
      console.error('[FirebaseAttemptService] Error deleting attempt:', error);
      throw error;
    }
  },
};

