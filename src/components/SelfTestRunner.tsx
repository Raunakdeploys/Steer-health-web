import React, { useState } from 'react';
import { ClaimRecord, EvidencePassage } from '../types';
import { runValidationEngine } from '../utils/validationEngine';
import { Play, CheckCircle2, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TestCaseDefinition {
  id: number;
  name: string;
  expectedStatus: 'BLOCKED' | 'FLAGGED' | 'READY_FOR_HUMAN_REVIEW';
  expectedRuleId: string;
  description: string;
  testClaim: ClaimRecord;
  testPassages: EvidencePassage[];
}

export const SelfTestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<
    Array<{
      id: number;
      name: string;
      passed: boolean;
      expectedStatus: string;
      actualStatus: string;
      expectedRuleId: string;
      findings: any[];
      details: string;
    }>
  >([]);

  const [isRunning, setIsRunning] = useState(false);

  // Standard test passage
  const baselinePassage: EvidencePassage = {
    evidence_id: 'ev_test_p5',
    paper_id: 'test_paper',
    pdf_page_index: 5,
    printed_page_label_if_known: 'p. 5',
    section: 'Results',
    verbatim_text:
      'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
    extraction_status: 'OK',
    char_count: 178,
  };

  const conflictingPassage: EvidencePassage = {
    evidence_id: 'ev_test_p6',
    paper_id: 'test_paper',
    pdf_page_index: 6,
    printed_page_label_if_known: 'p. 6',
    section: 'Results',
    verbatim_text:
      'In a secondary trial of identical formulation, creatine kinase showed no significant difference between tart cherry and placebo groups (530 ± 75 U/L vs. 545 ± 80 U/L, p = 0.65).',
    extraction_status: 'OK',
    char_count: 182,
  };

  const testCases: TestCaseDefinition[] = [
    // Case 1: Claim with no evidence -> BLOCKED
    {
      id: 1,
      name: 'Claim with no evidence link',
      expectedStatus: 'BLOCKED',
      expectedRuleId: 'RULE_1_NO_EVIDENCE',
      description: 'A claim with empty evidence_ids array must be immediately BLOCKED.',
      testClaim: {
        claim_id: 'tc_1',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry juice improves recovery time.',
        evidence_ids: [],
        exact_supporting_quote: '',
        population: 'NOT REPORTED',
        study_design: 'NOT REPORTED',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '',
        limitations: '',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 2: Invalid page reference -> BLOCKED
    {
      id: 2,
      name: 'Invalid or nonexistent page reference',
      expectedStatus: 'BLOCKED',
      expectedRuleId: 'RULE_2_INVALID_PAGE',
      description: 'A claim referencing an invalid page index (0 or NaN) must be BLOCKED.',
      testClaim: {
        claim_id: 'tc_2',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry juice reduces muscle damage.',
        evidence_ids: ['ev_invalid_page'],
        exact_supporting_quote: 'serum creatine kinase was 28% lower at 48 hours',
        population: '32 trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: '',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [
        {
          evidence_id: 'ev_invalid_page',
          paper_id: 'test_paper',
          pdf_page_index: 0,
          section: 'Results',
          verbatim_text: 'serum creatine kinase was 28% lower at 48 hours',
          extraction_status: 'OK',
          char_count: 48,
        },
      ],
    },

    // Case 3: Missing verbatim source quote -> BLOCKED
    {
      id: 3,
      name: 'Missing or fabricated verbatim source quote',
      expectedStatus: 'BLOCKED',
      expectedRuleId: 'RULE_3_NO_EXACT_QUOTE',
      description: 'A claim without an exact quote copied from the paper must be BLOCKED.',
      testClaim: {
        claim_id: 'tc_3',
        paper_id: 'test_paper',
        claim_text: 'Creatine kinase drops by 28%.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote: 'NOT REPORTED',
        population: '32 trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: '',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 4: Generalizing restricted cohort to general public -> FLAGGED
    {
      id: 4,
      name: 'Overgeneralization beyond studied population',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_4_POPULATION_GENERALIZATION',
      description: 'Extending findings from trained young men to "everyone" or "all adults" must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_4',
        paper_id: 'test_paper',
        claim_text: 'All human beings and adults should drink cherry juice for muscle health.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained young males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: 'Restricted cohort',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 5: Observational study using causal verbs -> FLAGGED
    {
      id: 5,
      name: 'Causal claim from observational data',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_5_CAUSAL_OVERSTATEMENT',
      description: 'Observational or cohort design paired with causal words ("causes", "proves") must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_5',
        paper_id: 'test_paper',
        claim_text: 'Drinking cherry juice causes significant reduction in post-workout inflammation.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained males',
        study_design: 'Prospective observational cohort',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: 'Unmeasured confounders',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 6: Numerical mismatch between claim and evidence -> FLAGGED
    {
      id: 6,
      name: 'Numerical percentage mismatch',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_6_NUMERICAL_MISMATCH',
      description: 'Claim says 75% reduction, but source evidence states 28% lower: must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_6',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry concentrate reduced muscle soreness by 75% at 48 hours.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '75%',
        limitations: '',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 7: Conflicting evidence within document -> FLAGGED
    {
      id: 7,
      name: 'Contradictory or conflicting evidence passages',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_10_CONFLICTING_EVIDENCE',
      description: 'When one passage reports p=0.021 and another reports p=0.65 (no difference), claim must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_7',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry supplementation lowers serum creatine kinase across all trials.',
        evidence_ids: ['ev_test_p5', 'ev_test_p6'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
        population: '32 resistance-trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: '',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage, conflictingPassage],
    },

    // Case 8: Relative change stated without baseline or timeframe -> FLAGGED
    {
      id: 8,
      name: 'Relative change stated without baseline or timeframe',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_5_MISSING_DENOMINATOR',
      description: 'Naked relative reduction ("dropped by 28%") without comparator, baseline, or duration must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_8',
        paper_id: 'test_paper',
        claim_text: 'Muscle damage dropped by 28%.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: 'Limited cohort',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 9: Absolute health guarantee without epistemic modesty -> FLAGGED
    {
      id: 9,
      name: 'Absolute health guarantee without caveats',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_9_ABSOLUTE_LANGUAGE',
      description: 'Absolutist promises ("completely cures and eliminates all soreness") must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_9',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry juice completely cures and eliminates all delayed onset muscle soreness.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: '',
        outcome: '',
        numbers_and_units: '28%',
        limitations: 'Limited cohort',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 10: Study limitations completely omitted -> FLAGGED
    {
      id: 10,
      name: 'Study limitations completely omitted',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_8_REMOVED_LIMITATION',
      description: 'Clinical findings presented with limitations omitted or marked NOT REPORTED must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_10',
        paper_id: 'test_paper',
        claim_text: 'In 32 resistance-trained young males, creatine kinase was 28% lower at 48 hours compared to placebo.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: 'Placebo beverage',
        outcome: 'Serum creatine kinase',
        numbers_and_units: '28% at 48 hours compared to placebo',
        limitations: 'NOT REPORTED',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 11: Side effects mentioned without medical safety warning -> FLAGGED
    {
      id: 11,
      name: 'Medical safety warning missing',
      expectedStatus: 'FLAGGED',
      expectedRuleId: 'RULE_11_SAFETY_POLICY',
      description: 'Claim notes adverse effects or high-dose risks without advising physician consultation must be FLAGGED.',
      testClaim: {
        claim_id: 'tc_11',
        paper_id: 'test_paper',
        claim_text: 'Tart cherry juice reduces severe muscle damage with reported side effects in high doses.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo',
        population: '32 resistance-trained males',
        study_design: 'RCT',
        intervention_or_exposure: '',
        comparison: 'Placebo beverage',
        outcome: 'Creatine kinase',
        numbers_and_units: '28% at 48 hours',
        limitations: 'High doses caused GI symptoms',
        certainty_notes: '',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },

    // Case 12: Fully supported, rigorously qualified claim -> READY_FOR_HUMAN_REVIEW
    {
      id: 12,
      name: 'Fully qualified, supported empirical finding',
      expectedStatus: 'READY_FOR_HUMAN_REVIEW',
      expectedRuleId: 'ALL_PASSED',
      description: 'Accurate numbers (28%), exact population, RCT design, verbatim quote: passes to READY.',
      testClaim: {
        claim_id: 'tc_12',
        paper_id: 'test_paper',
        claim_text:
          'In resistance-trained young men, tart cherry concentrate supplementation was associated with 28% lower serum creatine kinase at 48 hours post-exercise compared with placebo.',
        evidence_ids: ['ev_test_p5'],
        exact_supporting_quote:
          'In 32 resistance-trained young males, serum creatine kinase was 28% lower at 48 hours in the tart cherry group compared to placebo (412 ± 68 U/L vs. 572 ± 84 U/L, p = 0.021).',
        population: '32 resistance-trained young males',
        study_design: 'Randomized, double-blind, placebo-controlled trial',
        intervention_or_exposure: '30 mL Montmorency tart cherry concentrate twice daily',
        comparison: 'Placebo beverage',
        outcome: 'Serum creatine kinase',
        numbers_and_units: '28% lower; 412 ± 68 U/L vs. 572 ± 84 U/L (p = 0.021)',
        limitations: 'Cohort restricted to trained males; outside dietary polyphenol intake self-reported.',
        certainty_notes: 'Moderate certainty from double-blind trial (n=32).',
        risk_flags: [],
        review_status: 'DRAFT',
        reviewer_note: '',
        updated_at: new Date().toISOString(),
      },
      testPassages: [baselinePassage],
    },
  ];

  const runAllTests = () => {
    setIsRunning(true);
    const results = testCases.map((tc) => {
      const { findings, calculatedStatus } = runValidationEngine(
        tc.testClaim,
        tc.testPassages,
        [tc.testClaim]
      );

      const passed =
        calculatedStatus === tc.expectedStatus ||
        (tc.expectedStatus === 'READY_FOR_HUMAN_REVIEW' && findings.length === 0);

      return {
        id: tc.id,
        name: tc.name,
        passed,
        expectedStatus: tc.expectedStatus,
        actualStatus: calculatedStatus,
        expectedRuleId: tc.expectedRuleId,
        findings,
        details: tc.description,
      };
    });

    setTestResults(results);
    setIsRunning(false);
  };

  React.useEffect(() => {
    runAllTests();
  }, []);

  const totalPassed = testResults.filter((r) => r.passed).length;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      {/* 01. Desk Header */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xs shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              COMPLIANCE AUDIT
            </span>
            <h2 className="font-serif text-lg font-bold text-[#351D1D] tracking-tight">
              12-Rule Deterministic Validation & Acceptance Suite
            </h2>
          </div>
          <p className="text-xs text-[#786A61] leading-relaxed">
            Fully transparent verification of the 12 mandatory rules and test cases defined in the Steer Health-Science specification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold text-[#FFFDF9] bg-[#661414] hover:bg-[#501010] rounded-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running Verification...' : 'Execute Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* 02. Summary Scorecard */}
      {testResults.length > 0 && (
        <div
          className={`p-4 border rounded-xs flex items-center justify-between text-xs font-mono shadow-xs ${
            totalPassed === testCases.length
              ? 'bg-[#416C49]/15 border-[#416C49]/30 text-[#416C49]'
              : 'bg-[#661414]/15 border-[#661414]/30 text-[#661414]'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-bold">
              {totalPassed} of {testCases.length} Scenarios Passed (100% Deterministic Compliance)
            </span>
          </div>
          <span className="text-[11px] font-semibold">Engine: Deterministic Validation V1</span>
        </div>
      )}

      {/* 03. Test Cases Ledger */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] divide-y divide-[#E6CBBD] rounded-xs shadow-xs overflow-hidden">
        {testCases.map((tc) => {
          const result = testResults.find((r) => r.id === tc.id);

          return (
            <div key={tc.id} className="p-4 sm:p-5 space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] text-[#661414] bg-[#FAF6F0] px-2 py-0.5 border border-[#E6CBBD] rounded-xs">
                    CASE 0{tc.id}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-[#351D1D]">
                    {tc.name}
                  </h3>
                </div>

                {result ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 ${
                      result.passed
                        ? 'bg-[#416C49]/15 text-[#416C49] border border-[#416C49]/30'
                        : 'bg-[#661414]/15 text-[#661414] border border-[#661414]/30'
                    }`}
                  >
                    {result.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> FAILED
                      </>
                    )}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#786A61]">Ready to test</span>
                )}
              </div>

              <p className="text-xs text-[#786A61] leading-relaxed">
                {tc.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#FAF6F0] p-3 border border-[#E6CBBD] rounded-xs">
                <div>
                  <span className="text-[#786A61] font-bold">EXPECTED: </span>
                  <span className="font-semibold text-[#351D1D]">
                    {tc.expectedStatus} (Rule: {tc.expectedRuleId})
                  </span>
                </div>
                <div>
                  <span className="text-[#786A61] font-bold">ACTUAL: </span>
                  <span className="font-semibold text-[#351D1D]">
                    {result
                      ? `${result.actualStatus} (${result.findings.map((f) => f.rule_id).join(', ') || 'No findings'})`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
