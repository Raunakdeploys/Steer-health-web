import {
  parseQuestionsCsv,
  parsePastedText,
  clusterQuestionsIntoThemes,
  evaluateEvidenceGap,
  buildContentBrief,
  injectBriefIntoDeliverables,
  DATASET_GLP1_MUSCLE,
  DATASET_SOUTH_ASIAN_PHENOTYPE,
  DATASET_ADVERSARIAL_TEST,
} from '../src/utils/radarEngine.ts';
import { PAPER_GLP1, PASSAGES_GLP1, ALL_PAPERS, ALL_PASSAGES } from '../src/utils/storage.ts';
import { propagateClaimChange, analyzeClaimImpact } from '../src/utils/impactAnalysis.ts';

console.log('🧪 RUNNING ADVERSARIAL & COMPREHENSIVE RADAR TEST SUITE...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}: ${detail}`);
  } else {
    console.error(`❌ [FAIL] ${testName}: ${detail}`);
  }
}

// ----------------------------------------------------------------------------
// TEST 1: CSV PARSER RFC 4180 COMPLIANCE & COMMA ESCAPING
// ----------------------------------------------------------------------------
const complexCsv = `question,source,author,likes
"Does semaglutide, even at low doses, cause muscle loss?",Instagram,@user1,45
"Why am I skinny fat, despite walking 10,000 steps?",Clinical Q&A,Patient_A,12
"Does cutting white rice and roti cure insulin resistance?",Direct,Doctor,89`;

const parsed1 = parseQuestionsCsv(complexCsv);
assert(
  parsed1.questions.length === 3,
  'CSV Parser - Row Count',
  `Expected 3 questions, parsed ${parsed1.questions.length}`
);
assert(
  parsed1.questions[0].text === 'Does semaglutide, even at low doses, cause muscle loss?',
  'CSV Parser - Quoted Commas',
  'Successfully preserved commas inside double-quoted fields.'
);

// ----------------------------------------------------------------------------
// TEST 2: DUPLICATE DETECTION & MALFORMED ROWS
// ----------------------------------------------------------------------------
const dirtyCsv = `question,source
"Does GLP-1 cause muscle loss?",Instagram
"Does GLP-1 cause muscle loss?",Instagram
"Does GLP-1 cause muscle loss?",Instagram
,
   
"ok",Short
"What waist to height ratio is healthy for South Asians?",Instagram`;

const parsedDirty = parseQuestionsCsv(dirtyCsv);
assert(
  parsedDirty.duplicateCount === 2,
  'CSV Parser - Deduplication',
  `Detected and removed ${parsedDirty.duplicateCount} duplicate questions.`
);
assert(
  parsedDirty.emptyCount >= 2,
  'CSV Parser - Empty Row Rejection',
  `Safely dropped ${parsedDirty.emptyCount} empty or whitespace rows.`
);
assert(
  parsedDirty.questions.length === 2,
  'CSV Parser - Valid Extraction',
  `Extracted exactly 2 clean unique questions.`
);

// ----------------------------------------------------------------------------
// TEST 3: THEMATIC CLUSTERING WITH TRACEABLE COUNTS & VERBATIM EXAMPLES
// ----------------------------------------------------------------------------
const testQuestions = [...DATASET_GLP1_MUSCLE, ...DATASET_SOUTH_ASIAN_PHENOTYPE];
const themes = clusterQuestionsIntoThemes(testQuestions, ALL_PAPERS);

assert(
  themes.length >= 2,
  'Theme Clustering - Count',
  `Discovered ${themes.length} distinct metabolic themes.`
);

const glp1Theme = themes.find((t) => t.category === 'GLP-1 & Muscle Preservation');
assert(
  !!glp1Theme && glp1Theme.question_count === DATASET_GLP1_MUSCLE.length,
  'Theme Clustering - Exact Traceable Math',
  `GLP-1 theme question count (${glp1Theme?.question_count}) strictly matches dataset size (${DATASET_GLP1_MUSCLE.length}).`
);

assert(
  glp1Theme?.representative_questions.length! > 0 &&
    DATASET_GLP1_MUSCLE.some((q) => q.text === glp1Theme?.representative_questions[0]),
  'Theme Clustering - Verbatim Question Integrity',
  'Representative example is an EXACT verbatim quote from input data (not an AI hallucination).'
);

// ----------------------------------------------------------------------------
// TEST 4: EVIDENCE GAP EVALUATOR & BOUNDARY ENFORCEMENT
// ----------------------------------------------------------------------------
if (glp1Theme) {
  const gap = evaluateEvidenceGap(glp1Theme, PAPER_GLP1, PASSAGES_GLP1);
  assert(
    gap.status === 'SUPPORTED_BY_PASSAGE',
    'Evidence Gap - Corroborated Status',
    `Status marked as "${gap.status}" with reason: ${gap.status_reason}`
  );

  assert(
    gap.what_evidence_supports.includes('39.2%') && gap.what_evidence_supports.includes('5.26 kg'),
    'Evidence Gap - Primary Numerical Precision',
    'Includes exact DXA sub-study trial metrics (39.2% and 5.26 kg).'
  );

  assert(
    gap.what_evidence_does_not_establish.length > 30,
    'Evidence Gap - Negative Scientific Boundary',
    `Explicitly documents what the study does NOT prove: "${gap.what_evidence_does_not_establish.substring(0, 80)}..."`
  );
}

// ----------------------------------------------------------------------------
// TEST 5: RESPONSIBLE CONTENT BRIEF & "MUST NOT CLAIM" GUARDRAILS
// ----------------------------------------------------------------------------
if (glp1Theme) {
  const gap = evaluateEvidenceGap(glp1Theme, PAPER_GLP1, PASSAGES_GLP1);
  const brief = buildContentBrief(glp1Theme, gap, PAPER_GLP1);

  assert(
    brief.must_not_claim.length >= 3,
    'Content Brief - Negative Medical Constraints',
    `Contains ${brief.must_not_claim.length} explicit prohibitions against fearmongering/hyperbole.`
  );

  assert(
    brief.review_checklist.length === 6,
    'Content Brief - 6-Point Clinician Checklist',
    'Contains 6 required verification checklist items with designated roles.'
  );

  // --------------------------------------------------------------------------
  // TEST 6: 1-CLICK INSTAGRAM DELIVERABLES GENERATION
  // --------------------------------------------------------------------------
  const deliverables = injectBriefIntoDeliverables(brief, PAPER_GLP1, gap);

  assert(
    deliverables.carousel.slides.length === 6,
    'Deliverables - Carousel Slide Count',
    'Generated 6-slide editorial Instagram carousel.'
  );

  assert(
    deliverables.staticPost.headline.length > 10 && deliverables.staticPost.primary_finding.length > 20,
    'Deliverables - Static Graphic Content',
    'Generated 1080x1080 static post with headline, primary finding, and caveat.'
  );

  assert(
    deliverables.reel.scenes.length === 4,
    'Deliverables - Vertical Reel Scenes',
    'Generated 4-scene vertical reel with on-screen text and voiceover script.'
  );

  assert(
    deliverables.newClaims.length === 1 && deliverables.newClaims[0].evidence_ids.length > 0,
    'Deliverables - Audited Claim Record Linkage',
    `Generated ClaimRecord ${deliverables.newClaims[0].claim_id} linked to Passage ${deliverables.newClaims[0].evidence_ids[0]}.`
  );

  // --------------------------------------------------------------------------
  // TEST 7: SIGNATURE INTERACTION — "FIX ONCE, REVIEW EVERYWHERE" INVALIDATION
  // --------------------------------------------------------------------------
  const testClaim = deliverables.newClaims[0];
  const rejectedClaim = {
    ...testClaim,
    review_status: 'REJECTED' as const,
    reviewer_note: 'Clinician rejected: Unchecked population caveat.',
  };

  const { updatedCarousels, updatedStaticPosts, updatedReels, impactReport } =
    propagateClaimChange(rejectedClaim, testClaim, {
      carousels: [deliverables.carousel],
      staticPosts: [deliverables.staticPost],
      reels: [deliverables.reel],
    });

  assert(
    impactReport.has_impact && impactReport.affected_items_count >= 3,
    'Downstream Invalidation - Impact Traced',
    `Claim rejection accurately traced impact to ${impactReport.affected_items_count} downstream items.`
  );

  assert(
    updatedCarousels[0].status === 'INVALIDATED_BY_CLAIM_EDIT',
    'Downstream Invalidation - Carousel Status Blocked',
    `Carousel status marked as ${updatedCarousels[0].status}.`
  );

  assert(
    updatedStaticPosts[0].status === 'INVALIDATED_BY_CLAIM_EDIT',
    'Downstream Invalidation - Static Post Status Blocked',
    `Static post status marked as ${updatedStaticPosts[0].status}.`
  );

  assert(
    updatedReels[0].status === 'INVALIDATED_BY_CLAIM_EDIT',
    'Downstream Invalidation - Reel Status Blocked',
    `Vertical reel status marked as ${updatedReels[0].status}.`
  );
}

// ----------------------------------------------------------------------------
// TEST 8: ADVERSARIAL NON-MEDICAL & SARCASM SUITE
// ----------------------------------------------------------------------------
const advThemes = clusterQuestionsIntoThemes(DATASET_ADVERSARIAL_TEST, ALL_PAPERS);
const sinkTheme = advThemes.find((t) =>
  t.representative_questions.some((q) => q.toLowerCase().includes('sink'))
);
assert(
  sinkTheme?.category === 'Other / General Inquiry',
  'Adversarial - Non-Medical Isolation',
  'Leaky kitchen sink pipe query safely categorized under General Inquiry.'
);

console.log(`\n📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%).\n`);

if (passedTests === totalTests) {
  console.log('🎉 ALL RADAR ADVERSARIAL & OPERATIONAL TESTS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED.');
  process.exit(1);
}
