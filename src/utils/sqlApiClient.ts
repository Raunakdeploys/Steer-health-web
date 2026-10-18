import { PaperRecord, EvidencePassage, ClaimRecord, CarouselContent, StaticPostContent, ReelContent } from '../types';

export async function fetchUserDataFromSql(idToken: string) {
  const res = await fetch('/api/user/data', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch user data from Cloud SQL');
  }
  return res.json() as Promise<{
    papers: PaperRecord[];
    passages: EvidencePassage[];
    claims: ClaimRecord[];
    carousels: CarouselContent[];
    staticPosts: StaticPostContent[];
    reels: ReelContent[];
  }>;
}

export async function savePaperToSql(idToken: string, paper: PaperRecord, passages: EvidencePassage[]) {
  const res = await fetch('/api/user/paper', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ paper, passages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to persist paper to Cloud SQL');
  }
  return res.json();
}

export async function deletePaperFromSql(idToken: string, paperId: string) {
  const res = await fetch(`/api/user/paper/${encodeURIComponent(paperId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete paper from Cloud SQL');
  }
  return res.json();
}

export async function saveClaimToSql(idToken: string, claim: ClaimRecord) {
  const res = await fetch('/api/user/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ claim }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to persist claim to Cloud SQL');
  }
  return res.json();
}

export async function deleteClaimFromSql(idToken: string, claimId: string) {
  const res = await fetch(`/api/user/claim/${encodeURIComponent(claimId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete claim from Cloud SQL');
  }
  return res.json();
}

export async function saveDeliverableToSql(
  idToken: string,
  paperId: string,
  deliverableType: 'CAROUSEL' | 'STATIC' | 'REEL',
  id: string,
  payload: any
) {
  const res = await fetch('/api/user/deliverable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ paperId, deliverableType, id, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to persist deliverable to Cloud SQL');
  }
  return res.json();
}

export async function seedDemoToSql(idToken: string) {
  const res = await fetch('/api/user/seed-demo', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to seed demo data into Cloud SQL');
  }
  return res.json();
}
