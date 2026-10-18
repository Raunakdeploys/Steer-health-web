import React from 'react';
import {
  CarouselContent,
  ClaimRecord,
  EvidenceAuditReport,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  StaticPostContent,
} from '../types';
import { downloadJsonFile } from '../utils/exportUtils';
import {
  Download,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Printer,
  Quote,
} from 'lucide-react';

interface EvidenceReportViewProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
}

export const EvidenceReportView: React.FC<EvidenceReportViewProps> = ({
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
}) => {
  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#786A61]">
        Please ingest a scientific paper to generate an Evidence Audit Report.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  const approvedClaims = paperClaims.filter((c) => c.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = paperClaims.filter((c) => c.review_status === 'FLAGGED');
  const blockedClaims = paperClaims.filter((c) => c.review_status === 'BLOCKED');

  const overallStatus =
    blockedClaims.length > 0
      ? 'CONTAINS_BLOCKERS'
      : approvedClaims.length > 0
      ? 'VERIFIED_READY'
      : 'PENDING_HUMAN_APPROVAL';

  const reportData: EvidenceAuditReport = {
    generated_at: new Date().toISOString(),
    paper: activePaper,
    total_claims: paperClaims.length,
    approved_claims_count: approvedClaims.length,
    flagged_claims_count: flaggedClaims.length,
    blocked_claims_count: blockedClaims.length,
    claims: paperClaims,
    evidence_passages: paperPassages,
    generated_deliverables: {
      carousel: carousel || undefined,
      static_post: staticPost || undefined,
      reel: reel || undefined,
    },
    overall_status: overallStatus,
    disclaimer:
      'steer / Evidence Studio is an editorial research instrument for scientific content verification. It does not provide clinical certification, medical diagnoses, or treatment recommendations. Automated checks establish evidence traceability, not clinical truth.',
  };

  const handleDownloadReport = () => {
    downloadJsonFile(
      `steer-evidence-report-${activePaper.paper_id}.json`,
      reportData
    );
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 01. Desk Header & Print Actions */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#391E1D]">
            Evidence Traceability Report
          </h2>
          <p className="text-xs text-[#786A61]">
            Complete audit trail connecting published text, page citations, validation findings, and approved assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-medium text-[#391E1D] bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#786A61]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="px-4 py-1.5 text-xs font-semibold text-[#FFFDF9] bg-[#74191D] hover:bg-[#5b1317] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Audit Package</span>
          </button>
        </div>
      </div>

      {/* 02. Report Body Document Frame */}
      <div className="border border-[#DED2C5] bg-[#FFFDF9] p-6 sm:p-10 space-y-8">
        {/* Document Masthead */}
        <div className="pb-6 border-b border-[#DED2C5] flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#786A61]">
              <span>AUDIT ID: {activePaper.paper_id}</span>
              <span>·</span>
              <span>DATE: {new Date().toLocaleDateString()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#391E1D] leading-snug">
              {activePaper.title}
            </h1>
            <p className="text-xs text-[#786A61]">
              {activePaper.authors} · {activePaper.journal} ({activePaper.year}) · DOI: {activePaper.doi}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-xs uppercase ${
                overallStatus === 'VERIFIED_READY'
                  ? 'bg-[#416C49]/10 text-[#416C49] border border-[#416C49]/30'
                  : overallStatus === 'CONTAINS_BLOCKERS'
                  ? 'bg-[#74191D]/10 text-[#74191D] border border-[#74191D]/30'
                  : 'bg-[#BB4B2D]/10 text-[#BB4B2D] border border-[#BB4B2D]/30'
              }`}
            >
              STATUS: {overallStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Audit Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#F5EFE6]/40 border border-[#DED2C5]">
            <span className="text-[9px] uppercase text-[#786A61] block">Parsed Passages</span>
            <span className="text-lg font-bold text-[#391E1D] block mt-0.5">{paperPassages.length}</span>
          </div>
          <div className="p-3 bg-[#F5EFE6]/40 border border-[#DED2C5]">
            <span className="text-[9px] uppercase text-[#786A61] block">Total Extracted Claims</span>
            <span className="text-lg font-bold text-[#391E1D] block mt-0.5">{paperClaims.length}</span>
          </div>
          <div className="p-3 bg-[#F5EFE6]/40 border border-[#DED2C5]">
            <span className="text-[9px] uppercase text-[#416C49] block">Human Approved</span>
            <span className="text-lg font-bold text-[#416C49] block mt-0.5">{approvedClaims.length}</span>
          </div>
          <div className="p-3 bg-[#F5EFE6]/40 border border-[#DED2C5]">
            <span className="text-[9px] uppercase text-[#BB4B2D] block">Flagged / Blocked</span>
            <span className="text-lg font-bold text-[#BB4B2D] block mt-0.5">
              {blockedClaims.length + flaggedClaims.length}
            </span>
          </div>
        </div>

        {/* Claims Audit Table */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-[#391E1D] border-b border-[#DED2C5] pb-2">
            Claim-by-Claim Verification Ledger
          </h3>

          <div className="space-y-4">
            {paperClaims.map((claim, idx) => {
              const linkedP = paperPassages.filter((p) => claim.evidence_ids.includes(p.evidence_id));

              return (
                <div
                  key={claim.claim_id}
                  className="border border-[#DED2C5] p-4 space-y-3 bg-[#FFFDF9]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#74191D]">CLAIM #{idx + 1}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-xs font-semibold ${
                          claim.review_status === 'HUMAN_APPROVED'
                            ? 'bg-[#416C49]/15 text-[#416C49]'
                            : claim.review_status === 'BLOCKED'
                            ? 'bg-[#74191D]/15 text-[#74191D]'
                            : claim.review_status === 'FLAGGED'
                            ? 'bg-[#BB4B2D]/15 text-[#BB4B2D]'
                            : 'bg-[#DED2C5] text-[#391E1D]'
                        }`}
                      >
                        {claim.review_status}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#786A61]">
                      Updated: {new Date(claim.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-serif text-sm font-semibold text-[#391E1D] leading-snug">
                    {claim.claim_text}
                  </p>

                  <div className="bg-[#F7E9DE]/60 p-3 text-xs border border-[#DED2C5] space-y-1">
                    <span className="text-[9px] font-mono uppercase text-[#BB4B2D] font-bold block">
                      VERBATIM QUOTE (Page {linkedP[0]?.pdf_page_index || 'N/A'})
                    </span>
                    <blockquote className="italic font-serif text-[#391E1D] leading-relaxed">
                      "{claim.exact_supporting_quote}"
                    </blockquote>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#F5EFE6]/40 p-2.5 border border-[#DED2C5] font-mono">
                    <div>
                      <span className="text-[9px] text-[#786A61] block">POPULATION:</span>
                      <span className="text-[#391E1D] font-medium block truncate">{claim.population}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] block">DESIGN:</span>
                      <span className="text-[#391E1D] font-medium block truncate">{claim.study_design}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] block">OUTCOME:</span>
                      <span className="text-[#391E1D] font-medium block truncate">{claim.outcome || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] block">METRICS:</span>
                      <span className="text-[#391E1D] font-medium block truncate">{claim.numbers_and_units}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-4 border-t border-[#DED2C5] text-[11px] text-[#786A61] leading-relaxed font-mono">
          {reportData.disclaimer}
        </div>
      </div>
    </div>
  );
};
