import { adminDb } from '../lib/firebase-admin.ts';
import { PaperRecord, EvidencePassage, ClaimRecord } from '../types/index.ts';

const usersCollection = adminDb.collection('users');

export async function getUserPapers(userId: string): Promise<PaperRecord[]> {
  const snapshot = await usersCollection.doc(userId).collection('papers').get();
  return snapshot.docs.map(doc => doc.data() as PaperRecord);
}

export async function saveUserPaper(userId: string, paper: PaperRecord): Promise<void> {
  await usersCollection.doc(userId).collection('papers').doc(paper.paper_id).set(paper, { merge: true });
}

export async function deleteUserPaper(userId: string, paperId: string): Promise<void> {
  await usersCollection.doc(userId).collection('papers').doc(paperId).delete();
}

export async function getUserClaims(userId: string): Promise<ClaimRecord[]> {
  const snapshot = await usersCollection.doc(userId).collection('claims').get();
  return snapshot.docs.map(doc => doc.data() as ClaimRecord);
}

export async function saveUserClaim(userId: string, claim: ClaimRecord): Promise<void> {
  await usersCollection.doc(userId).collection('claims').doc(claim.claim_id).set(claim, { merge: true });
}

export async function deleteUserClaim(userId: string, claimId: string): Promise<void> {
  await usersCollection.doc(userId).collection('claims').doc(claimId).delete();
}

// Similar implementation for deliverables, etc.
export async function saveUserDeliverable(userId: string, paperId: string, deliverableType: string, id: string, payload: any): Promise<void> {
  await usersCollection.doc(userId).collection('deliverables').doc(id).set({
    ...payload,
    paperId,
    deliverableType
  }, { merge: true });
}

export async function getUserDeliverables(userId: string) {
  const snapshot = await usersCollection.doc(userId).collection('deliverables').get();
  const carousels: any[] = [];
  const staticPosts: any[] = [];
  const reels: any[] = [];

  snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deliverableType === 'CAROUSEL') carousels.push(data);
      else if (data.deliverableType === 'STATIC') staticPosts.push(data);
      else if (data.deliverableType === 'REEL') reels.push(data);
  });
  return { carousels, staticPosts, reels };
}

export async function getUserPassages(userId: string): Promise<EvidencePassage[]> {
  const snapshot = await usersCollection.doc(userId).collection('passages').get();
  return snapshot.docs.map(doc => doc.data() as EvidencePassage);
}

export async function saveUserPassages(userId: string, paperId: string, passages: EvidencePassage[]): Promise<void> {
  const batch = adminDb.batch();
  for (const p of passages) {
    const ref = usersCollection.doc(userId).collection('passages').doc(p.evidence_id);
    batch.set(ref, { ...p, paperId }, { merge: true });
  }
  await batch.commit();
}
