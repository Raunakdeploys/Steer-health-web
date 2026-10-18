import React from 'react';
import { ClaimRecord, EvidencePassage, PaperRecord } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  BookOpen,
  Quote,
  ShieldCheck,
  Check,
  X,
  Edit3,
  ExternalLink,
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
    <aside className="w-full lg:w-[310px] shrink-0 bg-[#FFFDF9] border-l border-[#DED2C5] flex flex-col h-full overflow-y-auto">
      {/* Inspector Header */}
      <div className="h-12 px-4 border-b border-[#DED2C5] flex items-center justify-between shrink-0 bg-[#F5EFE6]/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
            EVIDENCE INSPECTOR
          </span>
          {selectedClaim && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                selectedClaim.review_status === 'HUMAN_APPROVED'
                  ? 'bg-[#416C49]/10 text-[#416C49]'
                  : selectedClaim.review_status === 'FLAGGED'
                  ? 'bg-[#BB4B2D]/10 text-[#BB4B2D]'
                  : selectedClaim.review_status === 'BLOCKED'
                  ? 'bg-[#74191D]/15 text-[#74191D]'
                  : 'bg-[#DED2C5]/70 text-[#391E1D]'
              }`}
            >
              {selectedClaim.review_status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#786A61] hover:text-[#391E1D] p-1 cursor-pointer transition-colors"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inspector Body */}
      {selectedClaim ? (
        <div className="p-4 space-y-5 text-xs text-[#391E1D]">
          {/* Section 1: The Claim Statement */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              EXTRACTED CLAIM STATEMENT
            </span>
            <div className="p-3 bg-[#F5EFE6]/60 border-l-2 border-[#74191D] text-xs leading-relaxed font-medium">
              {selectedClaim.claim_text}
            </div>
          </div>

          {/* Section 2: Verbatim Quoted Source Evidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                <Quote className="w-3 h-3 text-[#BB4B2D]" />
                VERBATIM PAPER QUOTE
              </span>
              <span className="text-[10px] font-mono text-[#786A61]">
                {evidencePassage ? `p. ${evidencePassage.pdf_page_index}` : 'Exact text'}
              </span>
            </div>

            <div className="p-3 bg-[#F7E9DE]/70 border border-[#DED2C5] rounded-xs font-serif text-xs italic text-[#391E1D] leading-relaxed">
              "{selectedClaim.exact_supporting_quote || evidencePassage?.verbatim_text || 'No verbatim quote linked.'}"
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] pt-0.5">
              <span>Section: {evidencePassage?.section || 'Extracted passage'}</span>
              <span>ID: {selectedClaim.evidence_ids[0] || 'Unlinked'}</span>
            </div>
          </div>

          {/* Section 3: Study Design & Population Matrix */}
          <div className="border-t border-[#DED2C5] pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              METHODOLOGY ANCHORS
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#F5EFE6]/40 border border-[#DED2C5]/70">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Population</span>
                <span className="font-medium text-[#391E1D] block mt-0.5 leading-tight">
                  {selectedClaim.population}
                </span>
              </div>
              <div className="p-2 bg-[#F5EFE6]/40 border border-[#DED2C5]/70">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Design</span>
                <span className="font-medium text-[#391E1D] block mt-0.5 leading-tight">
                  {selectedClaim.study_design}
                </span>
              </div>
            </div>

            {selectedClaim.numbers_and_units && selectedClaim.numbers_and_units !== 'NOT REPORTED' && (
              <div className="p-2 bg-[#F5EFE6]/40 border border-[#DED2C5]/70 text-[11px]">
                <span className="text-[9px] font-mono uppercase text-[#786A61] block">Reported Metrics</span>
                <span className="font-mono text-xs text-[#391E1D] block mt-0.5">
                  {selectedClaim.numbers_and_units}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: 12-Rule Deterministic Validation Findings */}
          <div className="border-t border-[#DED2C5] pt-3 space-y-2">
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
                        ? 'bg-[#74191D]/5 border-[#74191D]/30 text-[#74191D]'
                        : 'bg-[#BB4B2D]/5 border-[#BB4B2D]/30 text-[#BB4B2D]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase">
                      <span>{f.rule_id}</span>
                      <span>{f.severity}</span>
                    </div>
                    <p className="text-[#391E1D] font-medium">{f.reason}</p>
                    <p className="text-[10px] font-mono text-[#786A61]">
                      Action: {f.recommended_action}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-[#416C49]/5 border border-[#416C49]/20 text-[#416C49] flex items-center gap-2 text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Passed deterministic validation checks</span>
              </div>
            )}
          </div>

          {/* Section 5: Limitations & Reviewer Notes */}
          {selectedClaim.limitations && selectedClaim.limitations !== 'NOT REPORTED' && (
            <div className="border-t border-[#DED2C5] pt-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                STATED STUDY LIMITATIONS
              </span>
              <p className="text-[11px] text-[#553636] leading-relaxed italic">
                {selectedClaim.limitations}
              </p>
            </div>
          )}

          {/* Section 6: Human Editorial Decision Actions */}
          <div className="border-t border-[#DED2C5] pt-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              EDITORIAL DECISION
            </span>

            <div className="flex flex-col gap-1.5">
              {onApproveClaim && (
                <button
                  onClick={() => onApproveClaim(selectedClaim)}
                  className={`w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs ${
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
                    className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#BB4B2D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Flag Issue</span>
                  </button>
                )}

                {onEditClaim && (
                  <button
                    onClick={() => onEditClaim(selectedClaim)}
                    className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#391E1D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
        <div className="p-4 space-y-4 text-xs text-[#391E1D]">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
              SELECTED PASSAGE
            </span>
            <div className="text-[11px] font-mono text-[#786A61]">
              Page {evidencePassage.pdf_page_index} · Section: {evidencePassage.section}
            </div>
          </div>

          <div className="p-3 bg-[#F7E9DE]/60 border border-[#DED2C5] font-serif text-xs italic leading-relaxed text-[#391E1D]">
            "{evidencePassage.verbatim_text}"
          </div>

          <div className="pt-2 text-[11px] text-[#786A61] font-mono">
            Length: {evidencePassage.char_count} chars
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-[#786A61] space-y-2">
          <BookOpen className="w-6 h-6 mx-auto text-[#DED2C5]" />
          <p className="text-xs font-medium">Select any claim row or passage to inspect provenance.</p>
          <p className="text-[11px] font-mono">Verbatim citations and 12-rule checks appear here.</p>
        </div>
      )}
    </aside>
  );
};
