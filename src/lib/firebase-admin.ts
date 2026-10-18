import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './firebase-config.ts';

const app = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    })
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
