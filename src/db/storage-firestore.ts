import { adminDb } from '../lib/firebase-admin.ts';
import type { PaperRecord, EvidencePassage, ClaimRecord } from '../types/index.ts';

const usersCollection = adminDb.collection('users');

export function normalizeEmailKey(userIdOrEmail: string): string {
  if (!userIdOrEmail) return 'anonymous-user';
  return userIdOrEmail.trim().toLowerCase();
}

export async function touchUserRecord(userId: string, metadata?: { email?: string; displayName?: string }): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).set({
      email: metadata?.email || key,
      displayName: metadata?.displayName || key.split('@')[0],
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not touch user record:', err);
  }
}

export async function getUserPapers(userId: string): Promise<PaperRecord[]> {
  const key = normalizeEmailKey(userId);
  try {
    const snapshot = await usersCollection.doc(key).collection('papers').get();
    return snapshot.docs.map(doc => doc.data() as PaperRecord);
  } catch (err) {
    console.warn(`Firestore getUserPapers failed for ${key}:`, err);
    return [];
  }
}

export async function saveUserPaper(userId: string, paper: PaperRecord): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).set({ email: key, lastUpdated: new Date().toISOString() }, { merge: true });
    await usersCollection.doc(key).collection('papers').doc(paper.paper_id).set(paper, { merge: true });
  } catch (err) {
    console.warn(`Firestore saveUserPaper error for ${key}:`, err);
  }
}

export async function deleteUserPaper(userId: string, paperId: string): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).collection('papers').doc(paperId).delete();
  } catch (err) {
    console.warn(`Firestore deleteUserPaper error for ${key}:`, err);
  }
}

export async function getUserClaims(userId: string): Promise<ClaimRecord[]> {
  const key = normalizeEmailKey(userId);
  try {
    const snapshot = await usersCollection.doc(key).collection('claims').get();
    return snapshot.docs.map(doc => doc.data() as ClaimRecord);
  } catch (err) {
    console.warn(`Firestore getUserClaims failed for ${key}:`, err);
    return [];
  }
}

export async function saveUserClaim(userId: string, claim: ClaimRecord): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).set({ email: key, lastUpdated: new Date().toISOString() }, { merge: true });
    await usersCollection.doc(key).collection('claims').doc(claim.claim_id).set(claim, { merge: true });
  } catch (err) {
    console.warn(`Firestore saveUserClaim error for ${key}:`, err);
  }
}

export async function deleteUserClaim(userId: string, claimId: string): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).collection('claims').doc(claimId).delete();
  } catch (err) {
    console.warn(`Firestore deleteUserClaim error for ${key}:`, err);
  }
}

export async function saveUserDeliverable(userId: string, paperId: string, deliverableType: string, id: string, payload: any): Promise<void> {
  const key = normalizeEmailKey(userId);
  try {
    await usersCollection.doc(key).set({ email: key, lastUpdated: new Date().toISOString() }, { merge: true });
    await usersCollection.doc(key).collection('deliverables').doc(id).set({
      ...payload,
      paperId,
      deliverableType
    }, { merge: true });
  } catch (err) {
    console.warn(`Firestore saveUserDeliverable error for ${key}:`, err);
  }
}

export async function getUserDeliverables(userId: string) {
  const key = normalizeEmailKey(userId);
  const carousels: any[] = [];
  const staticPosts: any[] = [];
  const reels: any[] = [];

  try {
    const snapshot = await usersCollection.doc(key).collection('deliverables').get();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deliverableType === 'CAROUSEL') carousels.push(data);
      else if (data.deliverableType === 'STATIC') staticPosts.push(data);
      else if (data.deliverableType === 'REEL') reels.push(data);
    });
  } catch (err) {
    console.warn(`Firestore getUserDeliverables failed for ${key}:`, err);
  }
  return { carousels, staticPosts, reels };
}

export async function getUserPassages(userId: string): Promise<EvidencePassage[]> {
  const key = normalizeEmailKey(userId);
  try {
    const snapshot = await usersCollection.doc(key).collection('passages').get();
    return snapshot.docs.map(doc => doc.data() as EvidencePassage);
  } catch (err) {
    console.warn(`Firestore getUserPassages failed for ${key}:`, err);
    return [];
  }
}

export async function saveUserPassages(userId: string, paperId: string, passages: EvidencePassage[]): Promise<void> {
  const key = normalizeEmailKey(userId);
  if (passages.length === 0) return;
  try {
    const batch = adminDb.batch();
    for (const p of passages) {
      const ref = usersCollection.doc(key).collection('passages').doc(p.evidence_id);
      batch.set(ref, { ...p, paperId }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn(`Firestore saveUserPassages error for ${key}:`, err);
  }
}
