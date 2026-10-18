import { pgTable, text, serial, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const papers = pgTable('papers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  journal: text('journal'),
  authors: text('authors'),
  year: integer('year'),
  doi: text('doi'),
  sourceUrl: text('source_url'),
  isSyntheticDemo: boolean('is_synthetic_demo').default(false),
  metadataVerified: boolean('metadata_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const evidencePassages = pgTable('evidence_passages', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  pdfPageIndex: integer('pdf_page_index').notNull(),
  section: text('section'),
  verbatimText: text('verbatim_text').notNull(),
  charStart: integer('char_start'),
  charEnd: integer('char_end'),
  hasFigureOrTable: boolean('has_figure_or_table').default(false),
  warning: text('warning'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const claims = pgTable('claims', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  claimText: text('claim_text').notNull(),
  evidenceIds: text('evidence_ids').notNull(), // JSON string array of evidence_ids
  exactSupportingQuote: text('exact_supporting_quote'),
  population: text('population'),
  studyDesign: text('study_design'),
  interventionOrExposure: text('intervention_or_exposure'),
  comparison: text('comparison'),
  outcome: text('outcome'),
  numbersAndUnits: text('numbers_and_units'),
  limitations: text('limitations'),
  certaintyNotes: text('certainty_notes'),
  riskFlags: text('risk_flags'), // JSON string array
  reviewStatus: text('review_status').notNull().default('DRAFT'),
  reviewerNote: text('reviewer_note'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const deliverables = pgTable('deliverables', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  deliverableType: text('deliverable_type').notNull(), // 'CAROUSEL' | 'STATIC' | 'REEL'
  payload: text('payload').notNull(), // JSON stringified deliverable content
  status: text('status').default('READY'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  papers: many(papers),
  evidencePassages: many(evidencePassages),
  claims: many(claims),
  deliverables: many(deliverables),
}));

export const papersRelations = relations(papers, ({ one, many }) => ({
  author: one(users, {
    fields: [papers.userId],
    references: [users.uid],
  }),
  passages: many(evidencePassages),
  claims: many(claims),
  deliverables: many(deliverables),
}));
