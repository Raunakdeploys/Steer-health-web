import React from 'react';
import { ClaimRecord, EvidencePassage, PaperRecord } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Quote,
  Check,
  X,
  Edit3,
} from 'lucide-react';

interface ContextInspectorProps {
  selectedClaim: ClaimRecord | null;
  evidencePassage: EvidencePassage | null;
  activePaper: PaperRecord | null;
  onApproveClaim?: (claim: ClaimRecord) => void;
  onFlagClaim?: (claim: ClaimRecord, note: string) => void;
  onRejectClaim?: (claim: ClaimRecord) => void;
  onEditClaim?: (claim: ClaimRecord) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  selectedClaim,
  evidencePassage,
  activePaper,
  onApproveClaim,
  onFlagClaim,
  onRejectClaim,
  onEditClaim,
  onClose,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-full lg:w-[320px] shrink-0 bg-[#FFFDF9] border-l border-[#E6CBBD] flex flex-col h-full overflow-y-auto">
      {/* Inspector Header */}
      <div className="h-14 px-4 border-b border-[#E6CBBD] flex items-center justify-between shrink-0 bg-[#FAF6F0]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#786A61] font-bold">
            EVIDENCE INSPECTOR
          </span>
          {selectedClaim && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                selectedClaim.review_status === 'HUMAN_APPROVED'
                  ? 'bg-[#416C49]/15 text-[#416C49]'
                  : selectedClaim.review_status === 'FLAGGED'
                  ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                  : selectedClaim.review_status === 'BLOCKED'
                  ? 'bg-[#661414]/15 text-[#661414]'
                  : 'bg-[#E6CBBD]/60 text-[#351D1D]'
              }`}
            >
              {selectedClaim.review_status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#786A61] hover:text-[#351D1D] p-1 cursor-pointer transition-colors"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inspector Body */}
      {selectedClaim ? (
        <div className="p-4 space-y-4 text-xs text-[#351D1D]">
          {/* Section 1: The Claim Statement */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              EXTRACTED CLAIM STATEMENT
            </span>
            <div className="p-3 bg-[#F8F2EB] border-l-2 border-[#661414] text-xs leading-relaxed font-medium rounded-r-xs">
              {selectedClaim.claim_text}
            </div>
          </div>

          {/* Section 2: Verbatim Quoted Source Evidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                <Quote className="w-3 h-3 text-[#C04E2A]" />
                VERBATIM PAPER QUOTE
              </span>
              <span className="text-[10px] font-mono text-[#786A61]">
                {evidencePassage ? `p. ${evidencePassage.pdf_page_index}` : 'Exact text'}
              </span>
            </div>

            <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs font-serif text-xs italic text-[#351D1D] leading-relaxed">
              "{selectedClaim.exact_supporting_quote || evidencePassage?.verbatim_text || 'No verbatim quote linked.'}"
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] pt-0.5">
              <span>Section: {evidencePassage?.section || 'Extracted passage'}</span>
              <span className="truncate max-w-[130px]">ID: {selectedClaim.evidence_ids[0] || 'Unlinked'}</span>
            </div>
          </div>

          {/* Section 3: Study Design & Population Matrix */}
          <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              METHODOLOGY ANCHORS
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Population</span>
                <span className="font-medium text-[#351D1D] block mt-0.5 leading-tight">
                  {selectedClaim.population}
                </span>
              </div>
              <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Design</span>
                <span className="font-medium text-[#351D1D] block mt-0.5 leading-tight">
                  {selectedClaim.study_design}
                </span>
              </div>
            </div>

            {selectedClaim.numbers_and_units && selectedClaim.numbers_and_units !== 'NOT REPORTED' && (
              <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs text-[11px]">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Reported Metrics</span>
                <span className="font-mono text-xs text-[#351D1D] block mt-0.5">
                  {selectedClaim.numbers_and_units}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: 12-Rule Deterministic Validation Findings */}
          <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              VALIDATION ENGINE CHECKS
            </span>

            {selectedClaim.validation_findings && selectedClaim.validation_findings.length > 0 ? (
              <div className="space-y-1.5">
                {selectedClaim.validation_findings.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xs border text-[11px] leading-snug space-y-1 ${
                      f.severity === 'BLOCKER'
                        ? 'bg-[#661414]/5 border-[#661414]/30 text-[#661414]'
                        : 'bg-[#C04E2A]/5 border-[#C04E2A]/30 text-[#C04E2A]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase">
                      <span>{f.rule_id}</span>
                      <span>{f.severity}</span>
                    </div>
                    <p className="text-[#351D1D] font-medium">{f.reason}</p>
                    <p className="text-[10px] font-mono text-[#786A61]">
                      Action: {f.recommended_action}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-[#416C49]/10 border border-[#416C49]/30 text-[#416C49] flex items-center gap-2 text-xs font-medium rounded-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Passed all deterministic validation checks</span>
              </div>
            )}
          </div>

          {/* Section 5: Limitations */}
          {selectedClaim.limitations && selectedClaim.limitations !== 'NOT REPORTED' && (
            <div className="border-t border-[#E6CBBD] pt-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                STATED STUDY LIMITATIONS
              </span>
              <p className="text-[11px] text-[#553636] leading-relaxed italic bg-[#F8F2EB] p-2.5 rounded-xs border border-[#E6CBBD]">
                {selectedClaim.limitations}
              </p>
            </div>
          )}

          {/* Section 6: Human Editorial Decision Actions */}
          <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              EDITORIAL DECISION
            </span>

            <div className="flex flex-col gap-1.5">
              {onApproveClaim && (
                <button
                  onClick={() => onApproveClaim(selectedClaim)}
                  className={`w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs shadow-xs ${
                    selectedClaim.review_status === 'HUMAN_APPROVED'
                      ? 'bg-[#416C49] text-[#FFFDF9]'
                      : 'bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedClaim.review_status === 'HUMAN_APPROVED'
                      ? 'Approved by Human Reviewer'
                      : 'Approve for Content Studio'}
                  </span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {onFlagClaim && (
                  <button
                    onClick={() => {
                      const note = prompt(
                        'Reason for flagging or requesting additional evidence:',
                        selectedClaim.reviewer_note || ''
                      );
                      if (note !== null) onFlagClaim(selectedClaim, note);
                    }}
                    className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#C04E2A] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Flag Issue</span>
                  </button>
                )}

                {onEditClaim && (
                  <button
                    onClick={() => onEditClaim(selectedClaim)}
                    className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#351D1D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                  >
                    <Edit3 className="w-3 h-3 text-[#786A61]" />
                    <span>Edit Claim</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : evidencePassage ? (
        <div className="p-4 space-y-4 text-xs text-[#351D1D]">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              SELECTED PASSAGE
            </span>
            <div className="text-[11px] font-mono text-[#786A61]">
              Page {evidencePassage.pdf_page_index} · Section: {evidencePassage.section}
            </div>
          </div>

          <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs font-serif text-xs italic leading-relaxed text-[#351D1D]">
            "{evidencePassage.verbatim_text}"
          </div>

          <div className="pt-2 text-[11px] text-[#786A61] font-mono">
            Length: {evidencePassage.char_count} chars
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-[#786A61] space-y-2">
          <BookOpen className="w-6 h-6 mx-auto text-[#B58777]" />
          <p className="text-xs font-medium">Select any claim row or passage to inspect provenance.</p>
          <p className="text-[11px] font-mono">Verbatim citations and 12-rule checks appear here.</p>
        </div>
      )}
    </aside>
  );
};
