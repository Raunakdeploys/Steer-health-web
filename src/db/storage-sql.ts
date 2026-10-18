import { db } from './index.ts';
import { papers, evidencePassages, claims, deliverables } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import {
  PaperRecord,
  EvidencePassage,
  ClaimRecord,
  CarouselContent,
  StaticPostContent,
  ReelContent,
} from '../types/index.ts';
import { ALL_PAPERS, ALL_PASSAGES, ALL_CLAIMS, ALL_CAROUSELS, ALL_STATIC_POSTS, ALL_REELS } from '../utils/storage.ts';

const isSqlConfigured = !!process.env.SQL_HOST;

export async function getUserPapers(userId: string): Promise<PaperRecord[]> {
  if (!isSqlConfigured) return ALL_PAPERS;
  try {
    const rows = await db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.createdAt));
    return rows.length > 0 ? rows.map((r) => ({
      paper_id: r.id,
      title: r.title,
      journal: r.journal || 'General Clinical Medicine',
      authors: r.authors || 'Authors Not Reported',
      year: r.year ? String(r.year) : String(new Date().getFullYear()),
      doi: r.doi || 'Not available',
      is_metadata_verified: !!r.metadataVerified,
      filename: r.sourceUrl || `${r.id}.pdf`,
      filesize_bytes: 1024 * 1024,
      uploaded_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      total_pages: 8,
      is_demo: !!r.isSyntheticDemo,
      extraction_warnings: [],
      has_unreadable_pages: false,
    })) : ALL_PAPERS;
  } catch {
    return ALL_PAPERS;
  }
}

export async function saveUserPaper(userId: string, paper: PaperRecord): Promise<void> {
  if (!isSqlConfigured) return;
  try {
    const parsedYear = parseInt(paper.year, 10) || new Date().getFullYear();
    await db.insert(papers).values({
      id: paper.paper_id,
      userId,
      title: paper.title,
      journal: paper.journal || null,
      authors: paper.authors || null,
      year: parsedYear,
      doi: paper.doi || null,
      sourceUrl: paper.filename || null,
      isSyntheticDemo: !!paper.is_demo,
      metadataVerified: !!paper.is_metadata_verified,
      createdAt: paper.uploaded_at ? new Date(paper.uploaded_at) : new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: papers.id,
      set: {
        title: paper.title,
        journal: paper.journal || null,
        authors: paper.authors || null,
        year: parsedYear,
        doi: paper.doi || null,
        sourceUrl: paper.filename || null,
        isSyntheticDemo: !!paper.is_demo,
        metadataVerified: !!paper.is_metadata_verified,
        updatedAt: new Date(),
      },
    });
  } catch {}
}

export async function deleteUserPaper(userId: string, paperId: string): Promise<void> {
  if (!isSqlConfigured) return;
  try {
    await db.delete(papers).where(and(eq(papers.id, paperId), eq(papers.userId, userId)));
  } catch {}
}

export async function getUserPassages(userId: string, paperId?: string): Promise<EvidencePassage[]> {
  if (!isSqlConfigured) return ALL_PASSAGES;
  try {
    const condition = paperId ? and(eq(evidencePassages.userId, userId), eq(evidencePassages.paperId, paperId)) : eq(evidencePassages.userId, userId);
    const rows = await db.select().from(evidencePassages).where(condition);
    return rows.length > 0 ? rows.map((r) => ({
      evidence_id: r.id,
      paper_id: r.paperId,
      pdf_page_index: r.pdfPageIndex,
      printed_page_label_if_known: `p. ${r.pdfPageIndex}`,
      section: (r.section as any) || 'Results',
      verbatim_text: r.verbatimText,
      extraction_status: 'OK',
      char_count: r.verbatimText.length,
    })) : ALL_PASSAGES;
  } catch {
    return ALL_PASSAGES;
  }
}

export async function saveUserPassages(userId: string, paperId: string, passagesList: EvidencePassage[]): Promise<void> {
  if (!isSqlConfigured || passagesList.length === 0) return;
  try {
    for (const p of passagesList) {
      await db.insert(evidencePassages).values({
        id: p.evidence_id,
        paperId,
        userId,
        pdfPageIndex: p.pdf_page_index,
        section: p.section || 'Other',
        verbatimText: p.verbatim_text,
        charStart: 0,
        charEnd: p.char_count || p.verbatim_text.length,
        hasFigureOrTable: false,
        warning: null,
        createdAt: new Date(),
      }).onConflictDoUpdate({
        target: evidencePassages.id,
        set: {
          pdfPageIndex: p.pdf_page_index,
          section: p.section || 'Other',
          verbatimText: p.verbatim_text,
        },
      });
    }
  } catch {}
}

export async function getUserClaims(userId: string, paperId?: string): Promise<ClaimRecord[]> {
  if (!isSqlConfigured) return ALL_CLAIMS;
  try {
    const condition = paperId ? and(eq(claims.userId, userId), eq(claims.paperId, paperId)) : eq(claims.userId, userId);
    const rows = await db.select().from(claims).where(condition);
    return rows.length > 0 ? rows.map((r) => ({
      claim_id: r.id,
      paper_id: r.paperId,
      claim_text: r.claimText,
      evidence_ids: JSON.parse(r.evidenceIds || '[]'),
      exact_supporting_quote: r.exactSupportingQuote || '',
      population: r.population || 'NOT REPORTED',
      study_design: r.studyDesign || 'NOT REPORTED',
      intervention_or_exposure: r.interventionOrExposure || 'NOT REPORTED',
      comparison: r.comparison || 'NOT REPORTED',
      outcome: r.outcome || 'NOT REPORTED',
      numbers_and_units: r.numbersAndUnits || 'NOT REPORTED',
      limitations: r.limitations || 'NOT REPORTED',
      certainty_notes: r.certaintyNotes || '',
      risk_flags: JSON.parse(r.riskFlags || '[]'),
      review_status: (r.reviewStatus as any) || 'DRAFT',
      reviewer_note: r.reviewerNote || '',
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    })) : ALL_CLAIMS;
  } catch {
    return ALL_CLAIMS;
  }
}

export async function saveUserClaim(userId: string, claim: ClaimRecord): Promise<void> {
  if (!isSqlConfigured) return;
  try {
    await db.insert(claims).values({
      id: claim.claim_id,
      paperId: claim.paper_id,
      userId,
      claimText: claim.claim_text,
      evidenceIds: JSON.stringify(claim.evidence_ids || []),
      exactSupportingQuote: claim.exact_supporting_quote || null,
      population: claim.population || null,
      studyDesign: claim.study_design || null,
      interventionOrExposure: claim.intervention_or_exposure || null,
      comparison: claim.comparison || null,
      outcome: claim.outcome || null,
      numbersAndUnits: claim.numbers_and_units || null,
      limitations: claim.limitations || null,
      certaintyNotes: claim.certainty_notes || null,
      riskFlags: JSON.stringify(claim.risk_flags || []),
      reviewStatus: claim.review_status,
      reviewerNote: claim.reviewer_note || null,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: claims.id,
      set: {
        claimText: claim.claim_text,
        evidenceIds: JSON.stringify(claim.evidence_ids || []),
        exactSupportingQuote: claim.exact_supporting_quote || null,
        population: claim.population || null,
        studyDesign: claim.study_design || null,
        interventionOrExposure: claim.intervention_or_exposure || null,
        comparison: claim.comparison || null,
        outcome: claim.outcome || null,
        numbersAndUnits: claim.numbers_and_units || null,
        limitations: claim.limitations || null,
        certaintyNotes: claim.certainty_notes || null,
        riskFlags: JSON.stringify(claim.risk_flags || []),
        reviewStatus: claim.review_status,
        reviewerNote: claim.reviewer_note || null,
        updatedAt: new Date(),
      },
    });
  } catch {}
}

export async function deleteUserClaim(userId: string, claimId: string): Promise<void> {
  if (!isSqlConfigured) return;
  try {
    await db.delete(claims).where(and(eq(claims.id, claimId), eq(claims.userId, userId)));
  } catch {}
}

export async function getUserDeliverables(userId: string, paperId?: string) {
  if (!isSqlConfigured) return { carousels: ALL_CAROUSELS, staticPosts: ALL_STATIC_POSTS, reels: ALL_REELS };
  try {
    const condition = paperId ? and(eq(deliverables.userId, userId), eq(deliverables.paperId, paperId)) : eq(deliverables.userId, userId);
    const rows = await db.select().from(deliverables).where(condition);
    if (rows.length === 0) return { carousels: ALL_CAROUSELS, staticPosts: ALL_STATIC_POSTS, reels: ALL_REELS };

    const carousels: CarouselContent[] = [];
    const staticPosts: StaticPostContent[] = [];
    const reels: ReelContent[] = [];

    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.payload);
        if (r.deliverableType === 'CAROUSEL') carousels.push(parsed);
        else if (r.deliverableType === 'STATIC') staticPosts.push(parsed);
        else if (r.deliverableType === 'REEL') reels.push(parsed);
      } catch {}
    }
    return { carousels, staticPosts, reels };
  } catch {
    return { carousels: ALL_CAROUSELS, staticPosts: ALL_STATIC_POSTS, reels: ALL_REELS };
  }
}

export async function saveUserDeliverable(userId: string, paperId: string, deliverableType: 'CAROUSEL' | 'STATIC' | 'REEL', id: string, payload: any): Promise<void> {
  if (!isSqlConfigured) return;
  try {
    await db.insert(deliverables).values({
      id,
      paperId,
      userId,
      deliverableType,
      payload: JSON.stringify(payload),
      status: payload.status || 'READY',
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: deliverables.id,
      set: {
        payload: JSON.stringify(payload),
        status: payload.status || 'READY',
        updatedAt: new Date(),
      },
    });
  } catch {}
}
