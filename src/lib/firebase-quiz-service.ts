/**
 * Firebase Firestore service for Quiz operations
 * Handles CRUD operations for quizzes in Firebase
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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { getAdminFirestore } from './firebase-admin';
import admin from 'firebase-admin';
import { Quiz } from './types';
import http from 'http';

// Detect if we're running on server (Node.js) or client (browser)
const isServer = typeof window === 'undefined';

const QUIZZES_COLLECTION = 'quizzes';

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
 * Convert Quiz to Firestore format
 */
function quizToFirestore(quiz: Omit<Quiz, 'id'>, useAdminSdk = false): any {
  if (useAdminSdk) {
    // For Admin SDK, we'll set timestamp separately
    return {
      ...quiz,
    };
  }
  // For client SDK, use serverTimestamp()
  return {
    ...quiz,
    createdAt: serverTimestamp(),
  };
}

/**
 * Convert Firestore document to Quiz
 */
function firestoreToQuiz(id: string, data: any): Quiz {
  return {
    ...data,
    id,
    createdAt: timestampToISO(data.createdAt),
  } as Quiz;
}

export const FirebaseQuizService = {
  /**
   * Get all quizzes
   */
  async getAll(): Promise<Quiz[]> {
    // #region agent log
    if (typeof window === 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-quiz-service.ts:75',message:'FirebaseQuizService.getAll called',data:{isServer:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    try {
      if (isServer) {
        // Server-side: use Admin SDK
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase-quiz-service.ts:78',message:'Using Admin SDK for getAll',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const adminDbInstance = getAdminFirestore();
        // #region agent log
        const logData1 = JSON.stringify({location:'firebase-quiz-service.ts:87',message:'About to query Firestore',data:{collection:QUIZZES_COLLECTION},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
        const req1 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req1.on('error',()=>{});req1.write(logData1);req1.end();
        // #endregion
        const snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
          .orderBy('createdAt', 'desc')
          .get();
        
        // #region agent log
        const logData2 = JSON.stringify({location:'firebase-quiz-service.ts:92',message:'Admin SDK query completed',data:{docCount:snapshot.docs.length,isEmpty:snapshot.empty},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
        const req2 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req2.on('error',()=>{});req2.write(logData2);req2.end();
        // #endregion
        
        const result = snapshot.docs.map(doc => 
          firestoreToQuiz(doc.id, doc.data())
        );
        // #region agent log
        const logData3 = JSON.stringify({location:'firebase-quiz-service.ts:100',message:'FirebaseQuizService.getAll result',data:{count:result.length,isEmpty:result.length===0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
        const req3 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req3.on('error',()=>{});req3.write(logData3);req3.end();
        // #endregion
        return result;
      }
      
      // Client-side: use client SDK
      // Try with orderBy first, but fallback to simple query if index doesn't exist
      let querySnapshot;
      try {
        querySnapshot = await getDocs(
          query(collection(db, QUIZZES_COLLECTION), orderBy('createdAt', 'desc'))
        );
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          querySnapshot = await getDocs(collection(db, QUIZZES_COLLECTION));
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      // #region agent log
      const logDataErr = JSON.stringify({location:'firebase-quiz-service.ts:132',message:'FirebaseQuizService.getAll error',data:{error:error instanceof Error?error.message:'Unknown',code:(error as any)?.code||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
      const reqErr = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});reqErr.on('error',()=>{});reqErr.write(logDataErr);reqErr.end();
      // #endregion
      console.error('[FirebaseQuizService] Error getting all quizzes:', error);
      throw error;
    }
  },

  /**
   * Get quiz by ID
   */
  async getById(id: string): Promise<Quiz | null> {
    try {
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const docSnap = await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).get();
        
        if (!docSnap.exists) {
          return null;
        }
        
        return firestoreToQuiz(docSnap.id, docSnap.data());
      }
      
      // Client-side: use client SDK
      const docRef = doc(db, QUIZZES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return firestoreToQuiz(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quiz by ID:', error);
      throw error;
    }
  },

  /**
   * Get quizzes by course ID
   */
  async getByCourse(courseId: string): Promise<Quiz[]> {
    try {
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
          .where('courseId', '==', courseId)
          .orderBy('createdAt', 'desc')
          .get();
        
        const docs = snapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
        return docs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      // Client-side: use client SDK
      // Try with orderBy first, but fallback to simple query if index doesn't exist
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('courseId', '==', courseId)
          );
          querySnapshot = await getDocs(q);
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quizzes by course:', error);
      throw error;
    }
  },

  /**
   * Get quizzes by teacher ID
   */
  async getByTeacher(teacherId: string): Promise<Quiz[]> {
    try {
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
          .where('createdBy', '==', teacherId)
          .orderBy('createdAt', 'desc')
          .get();
        
        const docs = snapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
        return docs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      // Client-side: use client SDK
      // Try with orderBy first, but fallback to simple query if index doesn't exist
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('createdBy', '==', teacherId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('createdBy', '==', teacherId)
          );
          querySnapshot = await getDocs(q);
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quizzes by teacher:', error);
      throw error;
    }
  },

  /**
   * Add a new quiz
   */
  async add(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    try {
      
      const quizData = quizToFirestore(quiz as Omit<Quiz, 'id'>);
      
      let docRef;
      
      // Use Admin SDK on server, client SDK on client
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        // Server-side: use Admin SDK
        const quizDataForAdmin = quizToFirestore(quiz as Omit<Quiz, 'id'>, true);
        const docRefAdmin = adminDbInstance.collection(QUIZZES_COLLECTION).doc();
        await docRefAdmin.set({
          ...quizDataForAdmin,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        docRef = { id: docRefAdmin.id } as any;
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const quizDataForClient = quizToFirestore(quiz as Omit<Quiz, 'id'>, false);
        docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizDataForClient);
      }
      
      console.log(`[FirebaseQuizService] Added quiz: ${docRef.id} - "${quiz.title}"`);
      
      // Return the created quiz with the generated ID
      return {
        ...quiz,
        id: docRef.id,
        createdAt: new Date().toISOString(),
      } as Quiz;
    } catch (error: any) {
      console.error('[FirebaseQuizService] Error adding quiz:', error);
      throw error;
    }
  },

  /**
   * Update an existing quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    try {
      
      // Remove id and createdAt from updates
      const { id: _, createdAt, ...updateData } = updates as any;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).update(updateData);
      } else {
        // Client-side: use client SDK
        const docRef = doc(db, QUIZZES_COLLECTION, id);
        await updateDoc(docRef, updateData);
      }
      
      console.log(`[FirebaseQuizService] Updated quiz: ${id}`);
      
      // Fetch and return updated quiz
      const updated = await this.getById(id);
      if (!updated) {
        throw new Error('Quiz not found after update');
      }
      
      return updated;
    } catch (error) {
      console.error('[FirebaseQuizService] Error updating quiz:', error);
      throw error;
    }
  },

  /**
   * Delete a quiz
   */
  async delete(id: string): Promise<void> {
    try {
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).delete();
      } else {
        // Client-side: use client SDK
        const docRef = doc(db, QUIZZES_COLLECTION, id);
        await deleteDoc(docRef);
      }
      
      console.log(`[FirebaseQuizService] Deleted quiz: ${id}`);
    } catch (error) {
      console.error('[FirebaseQuizService] Error deleting quiz:', error);
      throw error;
    }
  },
};

