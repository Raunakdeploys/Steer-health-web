export type ExtractionStatus = 'OK' | 'LOW_CONFIDENCE' | 'NO_TEXT' | 'MANUAL_ENTRY';

export type ClaimReviewStatus =
  | 'DRAFT'
  | 'FLAGGED'
  | 'BLOCKED'
  | 'READY_FOR_HUMAN_REVIEW'
  | 'HUMAN_APPROVED'
  | 'REJECTED';

export type FindingSeverity = 'BLOCKER' | 'FLAG' | 'INFO';

export type ValidationOutcome = 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_RUN';

export interface ValidationFinding {
  rule_id: string;
  rule_number: number;
  severity: FindingSeverity;
  reason: string;
  claim_text: string;
  supporting_quote?: string;
  recommended_action: string;
}

export interface ValidationCheckResult {
  rule_id: string;
  rule_number: number;
  rule_name: string;
  outcome: ValidationOutcome;
  severity: FindingSeverity;
  reason: string;
  evidence_examined: string;
  recommended_action: string;
  evaluated_at: string;
}

export interface EvidencePassage {
  evidence_id: string;
  paper_id: string;
  pdf_page_index: number; // 1-indexed
  printed_page_label_if_known?: string;
  section: 'Abstract' | 'Introduction' | 'Methods' | 'Results' | 'Discussion' | 'Limitations' | 'Other';
  verbatim_text: string;
  extraction_status: ExtractionStatus;
  char_count: number;
  linked_claim_ids?: string[];
  bounding_box_available?: boolean;
}

export interface ApprovedVersionSnapshot {
  claim_text: string;
  approved_at: string;
  approved_by: string; // e.g., 'Editorial Reviewer'
}

export interface ReviewHistoryEntry {
  id: string;
  timestamp: string;
  action: 'APPROVE' | 'FLAG' | 'REJECT' | 'EDIT' | 'RESET';
  reviewer: string;
  note?: string;
  previous_status: ClaimReviewStatus;
  new_status: ClaimReviewStatus;
  previous_claim_text?: string;
}

export interface ClaimRecord {
  claim_id: string;
  paper_id: string;
  claim_text: string;
  evidence_ids: string[];
  supporting_passage_ids?: string[];
  contradicting_passage_ids?: string[];
  exact_supporting_quote: string;
  population: string; // 'UNKNOWN' | 'NOT REPORTED' | specific text
  study_design: string; // 'UNKNOWN' | 'NOT REPORTED' | specific text
  intervention_or_exposure: string;
  comparison: string;
  outcome: string;
  numbers_and_units: string;
  limitations: string;
  certainty_notes: string;
  risk_flags: string[];
  review_status: ClaimReviewStatus;
  reviewer_note: string;
  approved_version?: ApprovedVersionSnapshot;
  review_history?: ReviewHistoryEntry[];
  updated_at: string;
  validation_findings?: ValidationFinding[];
  validation_checks?: ValidationCheckResult[];
}

export interface PaperRecord {
  paper_id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  is_metadata_verified: boolean;
  filename: string;
  filesize_bytes: number;
  uploaded_at: string;
  total_pages: number;
  is_demo: boolean;
  extraction_warnings?: string[];
  has_unreadable_pages?: boolean;
}

export interface InvalidationDetails {
  invalidated_at: string;
  triggered_by_claim_id: string;
  reason: string;
  affected_items: string[];
}

export interface CarouselSlide {
  slide_number: number;
  layout: 'cover' | 'finding_caveat' | 'evidence_source' | 'takeaway' | 'indian_context' | 'doctor_quote';
  headline: string;
  body_text: string;
  finding?: string;
  caveat_or_limitation?: string;
  source_citation?: string;
  mapped_claim_ids: string[];
  theme_variant?: 'cream' | 'maroon';
  hinglish_headline?: string;
  hinglish_body?: string;
  founder_note?: string;
  invalidation_flag?: {
    claim_id: string;
    reason: string;
    claim_status: ClaimReviewStatus;
  };
}

export interface CarouselContent {
  id: string;
  paper_id: string;
  approved_claim_ids: string[];
  title: string;
  slides: CarouselSlide[];
  caption: string;
  hinglish_caption?: string;
  hashtags: string[];
  status: 'DRAFT' | 'READY' | 'INVALIDATED_BY_CLAIM_EDIT' | 'NEEDS_REREVIEW';
  invalidation_details?: InvalidationDetails;
  generated_at: string;
}

export interface StaticPostContent {
  id: string;
  paper_id: string;
  approved_claim_ids: string[];
  headline: string;
  supporting_text: string;
  primary_finding: string;
  qualification: string;
  source_note: string;
  caption: string;
  hinglish_headline?: string;
  hinglish_supporting_text?: string;
  hinglish_caption?: string;
  founder_note?: string;
  hashtags: string[];
  status: 'DRAFT' | 'READY' | 'INVALIDATED_BY_CLAIM_EDIT' | 'NEEDS_REREVIEW';
  invalidation_details?: InvalidationDetails;
  generated_at: string;
}

export interface ReelScene {
  scene_number: number;
  duration_sec: number;
  title: string;
  on_screen_text: string;
  voiceover_script: string;
  subtitle_text: string;
  visual_cue: string;
  b_roll_type?: 'metabolic_animation' | 'morning_walk' | 'indian_plate' | 'doctor_consult' | 'dexa_scan';
  hinglish_voiceover?: string;
  hinglish_subtitle?: string;
  mapped_claim_ids: string[];
  invalidation_flag?: {
    claim_id: string;
    reason: string;
    claim_status: ClaimReviewStatus;
  };
}

export interface ReelContent {
  id: string;
  paper_id: string;
  approved_claim_ids: string[];
  title: string;
  scenes: ReelScene[];
  total_duration_sec: number;
  caption: string;
  hinglish_caption?: string;
  hashtags: string[];
  status: 'DRAFT' | 'READY' | 'INVALIDATED_BY_CLAIM_EDIT' | 'NEEDS_REREVIEW';
  invalidation_details?: InvalidationDetails;
  generated_at: string;
}

export interface ScheduledPost {
  id: string;
  paper_id: string;
  paper_title: string;
  title: string;
  format: 'CAROUSEL' | 'STATIC' | 'REEL';
  scheduled_for: string; // ISO date string
  slot_label: string; // e.g. "Monday 11:30 AM IST (Metabolic Deep Dive)"
  status: 'DOCTOR_APPROVED' | 'SCHEDULED' | 'READY_TO_PUBLISH';
  caption: string;
  hashtags: string[];
  deliverable_id: string;
  hook: string;
  language: 'EN' | 'HINGLISH';
}

export interface BatchRunResult {
  batch_id: string;
  started_at: string;
  completed_at: string;
  papers_processed: number;
  claims_extracted: number;
  deliverables_created: number;
  days_scheduled: number;
}

export interface EvidenceAuditReport {
  generated_at: string;
  paper: PaperRecord;
  total_claims: number;
  approved_claims_count: number;
  flagged_claims_count: number;
  blocked_claims_count: number;
  claims: ClaimRecord[];
  evidence_passages: EvidencePassage[];
  generated_deliverables: {
    carousel?: CarouselContent;
    static_post?: StaticPostContent;
    reel?: ReelContent;
  };
  overall_status: 'VERIFIED_READY' | 'PENDING_HUMAN_APPROVAL' | 'CONTAINS_BLOCKERS';
  disclaimer: string;
}

// Provenance Graph Data Structures
export type ProvenanceNodeType =
  | 'DOCUMENT'
  | 'PASSAGE'
  | 'CLAIM'
  | 'VALIDATION_CHECK'
  | 'DELIVERABLE';

export type ProvenanceEdgeType =
  | 'CONTAINS'
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'EVALUATES'
  | 'DERIVED_FROM'
  | 'DEPENDS_ON';

export interface ProvenanceNode {
  id: string;
  type: ProvenanceNodeType;
  label: string;
  sublabel?: string;
  status?: string;
  entityId: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface ProvenanceEdge {
  id: string;
  source: string;
  target: string;
  type: ProvenanceEdgeType;
  label?: string;
  severity?: 'normal' | 'contradiction' | 'invalidated';
}

export interface ProvenanceGraphData {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

export interface DownstreamImpactItem {
  deliverable_type: 'CAROUSEL' | 'STATIC' | 'REEL';
  deliverable_id: string;
  item_label: string;
  slide_or_scene_number?: number;
  current_copy: string;
  severity: 'HIGH_BLOCKER' | 'MEDIUM_WARNING';
  reason: string;
}

export interface ChangeImpactAnalysisResult {
  has_impact: boolean;
  triggering_claim_id: string;
  previous_status?: ClaimReviewStatus;
  current_status: ClaimReviewStatus;
  affected_items_count: number;
  affected_deliverables: DownstreamImpactItem[];
  summary: string;
}

