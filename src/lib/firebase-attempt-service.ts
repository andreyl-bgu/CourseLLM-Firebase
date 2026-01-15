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
import { getAdminFirestore } from './firebase-admin';
import admin from 'firebase-admin';
import { QuizAttempt } from './types';

// Detect if we're running on server (Node.js) or client (browser)
const isServer = typeof window === 'undefined';

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
function attemptToFirestore(attempt: Omit<QuizAttempt, 'id'>, useAdminSdk = false): any {
  if (useAdminSdk) {
    // For Admin SDK, we'll set timestamp separately
    return {
      ...attempt,
    };
  }
  // For client SDK, use serverTimestamp()
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
      let querySnapshot;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        querySnapshot = await adminDbInstance.collection(ATTEMPTS_COLLECTION)
          .where('quizId', '==', quizId)
          .get();
        
        const attempts = querySnapshot.docs.map(doc => 
          firestoreToAttempt(doc.id, doc.data())
        );
        
        return attempts.sort((a, b) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
      }
      
      // Client-side: use client SDK
      const q = query(
        collection(db, ATTEMPTS_COLLECTION),
        where('quizId', '==', quizId)
      );
      
      querySnapshot = await getDocs(q);
      
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
      let querySnapshot;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        querySnapshot = await adminDbInstance.collection(ATTEMPTS_COLLECTION)
          .where('studentId', '==', studentId)
          .get();
        
        const attempts = querySnapshot.docs.map(doc => 
          firestoreToAttempt(doc.id, doc.data())
        );
        
        return attempts.sort((a, b) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
      }
      
      // Client-side: use client SDK
      const q = query(
        collection(db, ATTEMPTS_COLLECTION),
        where('studentId', '==', studentId)
      );
      
      querySnapshot = await getDocs(q);
      
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
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:116',message:'getById called',data:{attemptId,isServer},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const docSnap = await adminDbInstance.collection(ATTEMPTS_COLLECTION).doc(attemptId).get();
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:124',message:'Admin SDK getById result',data:{attemptId,exists:docSnap.exists},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!docSnap.exists) {
          return null;
        }
        
        return firestoreToAttempt(docSnap.id, docSnap.data());
      }
      
      // Client-side: use client SDK
      const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
      const docSnap = await getDoc(docRef);
      
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:138',message:'Client SDK getById result',data:{attemptId,exists:docSnap.exists()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return firestoreToAttempt(docSnap.id, docSnap.data());
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:148',message:'getById error',data:{attemptId,isServer,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[FirebaseAttemptService] Error getting attempt by ID:', error);
      throw error;
    }
  },

  /**
   * Get student's attempt for a specific quiz
   */
  async getStudentAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
    try {
      let querySnapshot;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        querySnapshot = await adminDbInstance.collection(ATTEMPTS_COLLECTION)
          .where('quizId', '==', quizId)
          .where('studentId', '==', studentId)
          .get();
      } else {
        // Client-side: use client SDK
        const q = query(
          collection(db, ATTEMPTS_COLLECTION),
          where('quizId', '==', quizId),
          where('studentId', '==', studentId)
        );
        
        querySnapshot = await getDocs(q);
      }
      
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
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:168',message:'create called',data:{quizId:attempt.quizId,studentId:attempt.studentId,isServer},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      let docRef;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const attemptDataForAdmin = attemptToFirestore(attempt as Omit<QuizAttempt, 'id'>, true);
        const docRefAdmin = adminDbInstance.collection(ATTEMPTS_COLLECTION).doc();
        await docRefAdmin.set({
          ...attemptDataForAdmin,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: attempt.status === 'completed' ? admin.firestore.FieldValue.serverTimestamp() : null,
        });
        docRef = { id: docRefAdmin.id } as any;
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:183',message:'Admin SDK create completed',data:{id:docRef.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const attemptData = attemptToFirestore(attempt as Omit<QuizAttempt, 'id'>, false);
        docRef = await addDoc(collection(db, ATTEMPTS_COLLECTION), attemptData);
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:193',message:'Client SDK create completed',data:{id:docRef.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      
      console.log(`[FirebaseAttemptService] Created attempt: ${docRef.id}`);
      
      return {
        ...attempt,
        id: docRef.id,
        startedAt: new Date().toISOString(),
        completedAt: attempt.status === 'completed' ? new Date().toISOString() : undefined,
      } as QuizAttempt;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:207',message:'create error',data:{quizId:attempt.quizId,studentId:attempt.studentId,isServer,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[FirebaseAttemptService] Error creating attempt:', error);
      throw error;
    }
  },

  /**
   * Update an attempt (e.g., to mark as completed)
   */
  async update(attemptId: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:190',message:'update called',data:{attemptId,isServer},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Remove id and timestamp fields from updates
      const { id: _, startedAt, completedAt, ...updateData } = updates as any;
      
      // If marking as completed, set completedAt
      if (updates.status === 'completed') {
        if (isServer) {
          updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
        } else {
          updateData.completedAt = serverTimestamp();
        }
      }
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(ATTEMPTS_COLLECTION).doc(attemptId).update(updateData);
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:205',message:'Admin SDK update completed',data:{attemptId},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } else {
        // Client-side: use client SDK
        const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
        await updateDoc(docRef, updateData);
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:212',message:'Client SDK update completed',data:{attemptId},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }
      
      console.log(`[FirebaseAttemptService] Updated attempt: ${attemptId}`);
      
      // Fetch and return updated attempt
      const updated = await this.getById(attemptId);
      if (!updated) {
        throw new Error('Attempt not found after update');
      }
      
      return updated;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:228',message:'update error',data:{attemptId,isServer,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('[FirebaseAttemptService] Error updating attempt:', error);
      throw error;
    }
  },

  /**
   * Delete an attempt
   */
  async delete(attemptId: string): Promise<void> {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:222',message:'delete called',data:{attemptId,isServer},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(ATTEMPTS_COLLECTION).doc(attemptId).delete();
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:230',message:'Admin SDK delete completed',data:{attemptId},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } else {
        // Client-side: use client SDK
        const docRef = doc(db, ATTEMPTS_COLLECTION, attemptId);
        await deleteDoc(docRef);
        
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:236',message:'Client SDK delete completed',data:{attemptId},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
      
      console.log(`[FirebaseAttemptService] Deleted attempt: ${attemptId}`);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-attempt-service.ts:244',message:'delete error',data:{attemptId,isServer,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('[FirebaseAttemptService] Error deleting attempt:', error);
      throw error;
    }
  },
};

