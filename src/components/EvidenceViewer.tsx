import React, { useState } from 'react';
import { EvidencePassage, PaperRecord, ClaimRecord } from '../types';
import {
  Search,
  BookOpen,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
} from 'lucide-react';

interface EvidenceViewerProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  highlightEvidenceId?: string | null;
  onFormulateClaim: (passage: EvidencePassage) => void;
  onNavigateToReview: () => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  activePaper,
  passages,
  claims,
  highlightEvidenceId,
  onFormulateClaim,
  onNavigateToReview,
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    highlightEvidenceId || null
  );

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#786A61]">
        Please ingest a scientific paper to inspect its evidence passages.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const totalPages = Math.max(
    activePaper.total_pages || 1,
    ...paperPassages.map((p) => p.pdf_page_index)
  );

  // Filter passages for current page
  const pagePassages = paperPassages.filter((p) => p.pdf_page_index === selectedPageIndex);
  const filteredPassages = (
    selectedSection === 'ALL'
      ? pagePassages
      : pagePassages.filter((p) => p.section === selectedSection)
  ).filter((p) =>
    searchQuery === ''
      ? true
      : p.verbatim_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePassage =
    paperPassages.find((p) => p.evidence_id === selectedPassageId) ||
    filteredPassages[0] ||
    paperPassages[0] ||
    null;

  const linkedClaimsToActive = activePassage
    ? claims.filter((c) => c.evidence_ids.includes(activePassage.evidence_id))
    : [];

  const sections = ['ALL', 'Abstract', 'Methods', 'Results', 'Discussion', 'Limitations', 'Other'];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 01. Desk Header & Toolbar */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#391E1D]">
            Evidence Stitch & Provenance Desk
          </h2>
          <p className="text-xs text-[#786A61]">
            Inspect verbatim document excerpts indexed by page. Every derived claim links back to these source quotes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToReview}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Proceed to Claim Audit</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 02. Two-Column Workspace: Left Page & Passages Explorer, Right Passage Provenance Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Galley Proof Document View (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#DED2C5] flex flex-col">
          {/* Page Pagination Strip */}
          <div className="p-3 border-b border-[#DED2C5] flex flex-wrap items-center justify-between gap-2 bg-[#F5EFE6]/40">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono uppercase text-[#786A61] font-semibold mr-1">
                PDF Page:
              </span>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isSelected = selectedPageIndex === pageNum;
                const pageCount = paperPassages.filter((p) => p.pdf_page_index === pageNum).length;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setSelectedPageIndex(pageNum)}
                    className={`w-7 h-7 text-xs font-mono font-medium rounded-xs border transition-colors cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#74191D] text-[#FFFDF9] border-[#74191D]'
                        : pageCount > 0
                        ? 'bg-[#FFFDF9] text-[#391E1D] border-[#DED2C5] hover:bg-[#F5EFE6]'
                        : 'bg-transparent text-[#786A61]/40 border-transparent hover:border-[#DED2C5]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={selectedPageIndex <= 1}
                onClick={() => setSelectedPageIndex((prev) => Math.max(1, prev - 1))}
                className="p-1 border border-[#DED2C5] hover:bg-[#F5EFE6] disabled:opacity-30 rounded-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={selectedPageIndex >= totalPages}
                onClick={() => setSelectedPageIndex((prev) => Math.min(totalPages, prev + 1))}
                className="p-1 border border-[#DED2C5] hover:bg-[#F5EFE6] disabled:opacity-30 rounded-xs cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section Filter and Search */}
          <div className="p-3 border-b border-[#DED2C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#786A61] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search page text..."
                className="w-full bg-[#FFFDF9] border border-[#DED2C5] text-xs py-1 pl-8 pr-3 text-[#391E1D] rounded-xs focus:outline-none focus:border-[#74191D]"
              />
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto">
              {sections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2 py-1 rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                    selectedSection === sec
                      ? 'bg-[#391E1D] text-[#FFFDF9]'
                      : 'text-[#786A61] hover:text-[#391E1D] hover:bg-[#F5EFE6]'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Verbatim Passages List on Selected Page */}
          <div className="divide-y divide-[#DED2C5] max-h-[700px] overflow-y-auto">
            {filteredPassages.length > 0 ? (
              filteredPassages.map((passage) => {
                const isSelected = activePassage?.evidence_id === passage.evidence_id;
                const linkedCount = claims.filter((c) =>
                  c.evidence_ids.includes(passage.evidence_id)
                ).length;

                return (
                  <div
                    key={passage.evidence_id}
                    id={passage.evidence_id}
                    onClick={() => setSelectedPassageId(passage.evidence_id)}
                    className={`p-4 transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#F7E9DE]/40 border-l-3 border-[#74191D]'
                        : 'hover:bg-[#F5EFE6]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#74191D]">
                          Page {passage.pdf_page_index}
                        </span>
                        <span>·</span>
                        <span className="text-[#391E1D] font-medium uppercase tracking-wider">
                          {passage.section}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {linkedCount > 0 ? (
                          <span className="text-[#416C49] font-medium">
                            {linkedCount} claim{linkedCount === 1 ? '' : 's'} linked
                          </span>
                        ) : (
                          <span>Unlinked</span>
                        )}
                        <span>·</span>
                        <span>{passage.char_count} chars</span>
                      </div>
                    </div>

                    <p className="font-serif text-xs leading-relaxed text-[#391E1D]">
                      {passage.verbatim_text}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#786A61] text-xs">
                No extracted passages found on Page {selectedPageIndex} matching this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Passage Detail & Claims Formulation Desk (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#DED2C5] p-5 space-y-5 sticky top-20">
          {activePassage ? (
            <>
              <div className="flex items-center justify-between border-b border-[#DED2C5] pb-3 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                  EVIDENCE PROVENANCE
                </span>
                <span className="font-mono text-[11px] text-[#786A61]">
                  ID: {activePassage.evidence_id}
                </span>
              </div>

              {/* Passage Verbatim Quotation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                    <Quote className="w-3 h-3 text-[#BB4B2D]" />
                    VERBATIM PASSAGE TEXT
                  </span>
                  <span className="text-[10px] font-mono text-[#786A61]">
                    p. {activePassage.pdf_page_index} ({activePassage.section})
                  </span>
                </div>

                <div className="p-3.5 bg-[#F7E9DE]/80 border border-[#DED2C5] font-serif text-xs italic leading-relaxed text-[#391E1D]">
                  "{activePassage.verbatim_text}"
                </div>
              </div>

              {/* Formulate Action Button */}
              <button
                onClick={() => onFormulateClaim(activePassage)}
                className="w-full py-2 px-3 text-xs font-semibold bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Formulate Health Claim from this Passage</span>
              </button>

              {/* Linked Claims List */}
              <div className="border-t border-[#DED2C5] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                    DERIVED HEALTH CLAIMS ({linkedClaimsToActive.length})
                  </span>
                </div>

                {linkedClaimsToActive.length > 0 ? (
                  <div className="space-y-2">
                    {linkedClaimsToActive.map((claim) => (
                      <div
                        key={claim.claim_id}
                        className="p-3 border border-[#DED2C5] bg-[#F5EFE6]/30 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                              claim.review_status === 'HUMAN_APPROVED'
                                ? 'bg-[#416C49]/15 text-[#416C49]'
                                : 'bg-[#DED2C5] text-[#391E1D]'
                            }`}
                          >
                            {claim.review_status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-[#786A61]">
                            {claim.study_design}
                          </span>
                        </div>
                        <p className="font-serif font-semibold text-[#391E1D]">
                          {claim.claim_text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[#786A61] text-xs bg-[#F5EFE6]/20 border border-dashed border-[#DED2C5]">
                    No claims have been formulated from this specific passage yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#786A61] text-xs">
              Select an extracted passage to inspect provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
