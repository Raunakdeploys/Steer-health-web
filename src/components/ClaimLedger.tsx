import React, { useState } from 'react';
import {
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ValidationFinding,
} from '../types';
import { runValidationEngine } from '../utils/validationEngine';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  ExternalLink,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  X,
  FileText,
  ArrowRight,
  ShieldCheck,
  Quote,
  Search,
} from 'lucide-react';

interface ClaimLedgerProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  onUpdateClaim: (claim: ClaimRecord, wasApprovedEdited: boolean) => void;
  onAddClaim: (claim: ClaimRecord) => void;
  onDeleteClaim: (claimId: string) => void;
  onBatchAddClaims: (claims: ClaimRecord[]) => void;
  onBatchUpdateClaims?: (claims: ClaimRecord[]) => void;
  onViewSourcePassage: (evidenceId: string) => void;
  onNavigateToStudio: () => void;
  selectedClaimId?: string | null;
  onSelectClaim?: (claim: ClaimRecord) => void;
}

export const ClaimLedger: React.FC<ClaimLedgerProps> = ({
  activePaper,
  passages,
  claims,
  onUpdateClaim,
  onAddClaim,
  onDeleteClaim,
  onBatchAddClaims,
  onBatchUpdateClaims,
  onViewSourcePassage,
  onNavigateToStudio,
  selectedClaimId: externalSelectedClaimId,
  onSelectClaim,
}) => {
  const [internalSelectedClaimId, setInternalSelectedClaimId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingAiClaims, setIsGeneratingAiClaims] = useState(false);
  const [isAuditingClaims, setIsAuditingClaims] = useState(false);
  const [auditSummary, setAuditSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Edit claim modal state
  const [editingClaim, setEditingClaim] = useState<ClaimRecord | null>(null);

  // New manual claim modal
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimText, setNewClaimText] = useState('');
  const [newSelectedEvidenceId, setNewSelectedEvidenceId] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newPopulation, setNewPopulation] = useState('NOT REPORTED');
  const [newStudyDesign, setNewStudyDesign] = useState('NOT REPORTED');
  const [newNumbers, setNewNumbers] = useState('NOT REPORTED');
  const [newLimitations, setNewLimitations] = useState('NOT REPORTED');

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#786A61]">
        Please ingest a scientific paper to inspect its claim ledger.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  // Re-run validation engine deterministically
  const validatedClaims = paperClaims.map((claim) => {
    const { findings, calculatedStatus } = runValidationEngine(claim, paperPassages, paperClaims);
    return {
      ...claim,
      validation_findings: findings,
      review_status:
        claim.review_status === 'HUMAN_APPROVED' && !findings.some((f) => f.severity === 'BLOCKER')
          ? 'HUMAN_APPROVED'
          : calculatedStatus,
    };
  });

  const filteredClaims = validatedClaims.filter((claim) => {
    const matchesFilter = statusFilter === 'ALL' || claim.review_status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      claim.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.exact_supporting_quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.population.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeClaimId = externalSelectedClaimId || internalSelectedClaimId;
  const activeClaim =
    validatedClaims.find((c) => c.claim_id === activeClaimId) ||
    filteredClaims[0] ||
    validatedClaims[0] ||
    null;

  const linkedPassage = activeClaim
    ? paperPassages.find((p) => activeClaim.evidence_ids.includes(p.evidence_id))
    : null;

  const approvedCount = validatedClaims.filter((c) => c.review_status === 'HUMAN_APPROVED').length;
  const blockedCount = validatedClaims.filter((c) => c.review_status === 'BLOCKED').length;
  const flaggedCount = validatedClaims.filter((c) => c.review_status === 'FLAGGED').length;
  const pendingCount = validatedClaims.filter((c) => c.review_status === 'READY_FOR_HUMAN_REVIEW').length;

  const handleSelectClaimRecord = (claim: ClaimRecord) => {
    setInternalSelectedClaimId(claim.claim_id);
    if (onSelectClaim) onSelectClaim(claim);
  };

  // Server-side AI Claim Drafting
  const handleDraftClaimsViaGemini = async () => {
    if (paperPassages.length === 0) {
      alert('No readable extracted passages found for this paper.');
      return;
    }

    setIsGeneratingAiClaims(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generate-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: activePaper.paper_id,
          paper_title: activePaper.title,
          passages: paperPassages.map((p) => ({
            evidence_id: p.evidence_id,
            pdf_page_index: p.pdf_page_index,
            verbatim_text: p.verbatim_text,
            section: p.section,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract claims from server.');
      }

      if (data.claims && Array.isArray(data.claims)) {
        onBatchAddClaims(data.claims);
        if (data.claims.length > 0) {
          handleSelectClaimRecord(data.claims[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error communicating with claim extraction model.');
    } finally {
      setIsGeneratingAiClaims(false);
    }
  };

  // Automated Claim Audit via Gemini 3.8 Flash Clinical Engine
  const handleAutoAuditClaimsViaGemini = async () => {
    if (paperClaims.length === 0) {
      alert('No claims found for this paper to audit.');
      return;
    }

    setIsAuditingClaims(true);
    setAiError(null);
    setAuditSummary(null);

    try {
      const response = await fetch('/api/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_title: activePaper.title,
          claims: paperClaims,
          passages: paperPassages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-audit claims.');
      }

      if (data.audited_claims && Array.isArray(data.audited_claims)) {
        if (onBatchUpdateClaims) {
          onBatchUpdateClaims(data.audited_claims);
        } else {
          data.audited_claims.forEach((c: ClaimRecord) => onUpdateClaim(c, false));
        }

        const approved = data.audited_claims.filter(
          (c: any) => c.review_status === 'HUMAN_APPROVED'
        ).length;
        const flagged = data.audited_claims.filter(
          (c: any) => c.review_status === 'FLAGGED_CONCERN' || c.review_status === 'FLAGGED'
        ).length;
        setAuditSummary(
          `Gemini 3.8 Flash Clinical Audit Complete: ${approved} claim(s) doctor-approved, ${flagged} claim(s) flagged for editorial review.`
        );
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Auto-audit communication error with Gemini 3.8 Flash.');
    } finally {
      setIsAuditingClaims(false);
    }
  };

  const handleAuditSingleClaimViaGemini = async (claim: ClaimRecord) => {
    setIsAuditingClaims(true);
    setAiError(null);
    try {
      const response = await fetch('/api/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_title: activePaper.title,
          claims: [claim],
          passages: paperPassages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to audit claim.');
      }

      if (data.audited_claims && data.audited_claims[0]) {
        onUpdateClaim(data.audited_claims[0], false);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to audit single claim.');
    } finally {
      setIsAuditingClaims(false);
    }
  };

  // Human Review Actions
  const handleApprove = (claim: ClaimRecord) => {
    const hasBlockers = claim.validation_findings?.some((f) => f.severity === 'BLOCKER');
    if (hasBlockers) {
      alert('Cannot approve claim: It contains blocking validation errors that must be resolved first.');
      return;
    }

    const updated: ClaimRecord = {
      ...claim,
      review_status: 'HUMAN_APPROVED',
      approved_version: {
        claim_text: claim.claim_text,
        approved_at: new Date().toISOString(),
        approved_by: 'Editorial Research Reviewer',
      },
      updated_at: new Date().toISOString(),
    };
    onUpdateClaim(updated, false);
  };

  const handleFlag = (claim: ClaimRecord, note: string) => {
    const updated: ClaimRecord = {
      ...claim,
      review_status: 'FLAGGED',
      reviewer_note: note,
      updated_at: new Date().toISOString(),
    };
    onUpdateClaim(updated, claim.review_status === 'HUMAN_APPROVED');
  };

  const handleReject = (claim: ClaimRecord) => {
    const updated: ClaimRecord = {
      ...claim,
      review_status: 'REJECTED',
      updated_at: new Date().toISOString(),
    };
    onUpdateClaim(updated, claim.review_status === 'HUMAN_APPROVED');
  };

  // Save Claim Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    const wasApproved = editingClaim.review_status === 'HUMAN_APPROVED';
    const updated: ClaimRecord = {
      ...editingClaim,
      updated_at: new Date().toISOString(),
    };

    onUpdateClaim(updated, wasApproved);
    setEditingClaim(null);
  };

  // Manual Claim Formulation
  const handleCreateManualClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim() || !newSelectedEvidenceId) {
      alert('Claim statement and linked evidence passage are required.');
      return;
    }

    const newClaim: ClaimRecord = {
      claim_id: `claim_${activePaper.paper_id}_manual_${Date.now().toString(36)}`,
      paper_id: activePaper.paper_id,
      claim_text: newClaimText.trim(),
      evidence_ids: [newSelectedEvidenceId],
      exact_supporting_quote: newQuote.trim(),
      population: newPopulation.trim() || 'NOT REPORTED',
      study_design: newStudyDesign.trim() || 'NOT REPORTED',
      intervention_or_exposure: 'NOT REPORTED',
      comparison: 'NOT REPORTED',
      outcome: 'NOT REPORTED',
      numbers_and_units: newNumbers.trim() || 'NOT REPORTED',
      limitations: newLimitations.trim() || 'NOT REPORTED',
      certainty_notes: 'Formulated manually from verbatim passage.',
      risk_flags: [],
      review_status: 'READY_FOR_HUMAN_REVIEW',
      reviewer_note: 'Manually drafted claim.',
      updated_at: new Date().toISOString(),
    };

    onAddClaim(newClaim);
    setShowNewClaimModal(false);
    setNewClaimText('');
    setNewQuote('');
    handleSelectClaimRecord(newClaim);
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
      {/* 01. Desk Action Header & Filter Bar */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Left: Metrics & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              STAGE 02
            </span>
            <h2 className="font-serif font-bold text-lg text-[#351D1D]">
              Doctor Review Gate (12-Rule Clinical Audit)
            </h2>
          </div>
          <p className="text-xs text-[#786A61]">
            Deterministic rule engine checks verbatim quotes, study design, and pop over-generalization before content generation.
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px] pt-1">
            <span className="text-[#416C49] font-semibold bg-[#416C49]/10 px-2 py-0.5 rounded-xs">
              ✓ {approvedCount} Human Approved
            </span>
            <span className="text-[#BB4B2D] font-semibold bg-[#BB4B2D]/10 px-2 py-0.5 rounded-xs">
              ⚠ {flaggedCount} Flagged
            </span>
            {blockedCount > 0 && (
              <span className="text-[#661414] font-semibold bg-[#661414]/10 px-2 py-0.5 rounded-xs">
                ✕ {blockedCount} Blocked
              </span>
            )}
            <span className="text-[#786A61] font-mono">
              ({validatedClaims.length} Claims Total)
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowNewClaimModal(true)}
            className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#391E1D] border border-[#DED2C5] rounded-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#74191D]" />
            <span>Formulate Claim</span>
          </button>

          <button
            onClick={handleDraftClaimsViaGemini}
            disabled={isGeneratingAiClaims}
            className="px-3 py-1.5 bg-[#74191D] hover:bg-[#5b1317] disabled:opacity-50 text-[#FFFDF9] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            {isGeneratingAiClaims ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingAiClaims ? 'Extracting...' : 'Extract Claims (AI Draft)'}</span>
          </button>

          <button
            onClick={handleAutoAuditClaimsViaGemini}
            disabled={isAuditingClaims || paperClaims.length === 0}
            className="px-3.5 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] disabled:opacity-50 text-[#F5EBDF] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            title="Cross-reference all claims against source passages with Gemini 3.8 Flash and auto-approve verified claims"
          >
            {isAuditingClaims ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#C04E2A]" />
            )}
            <span>{isAuditingClaims ? 'Auditing with Gemini...' : 'Auto-Audit All (Gemini 3.8 Flash)'}</span>
          </button>

          {approvedCount > 0 && (
            <button
              onClick={onNavigateToStudio}
              className="px-3 py-1.5 bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] rounded-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>Content Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {auditSummary && (
        <div className="p-3 bg-[#416C49]/10 border border-[#416C49]/30 text-[#416C49] text-xs flex items-center justify-between gap-2 rounded-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#416C49]" />
            <span>{auditSummary}</span>
          </div>
          <button
            onClick={() => setAuditSummary(null)}
            className="text-[10px] font-mono hover:text-[#351D1D] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {aiError && (
        <div className="p-3 bg-[#74191D]/10 border border-[#74191D]/30 text-[#74191D] text-xs">
          {aiError}
        </div>
      )}

      {/* 02. Two-Column Review Layout: Left Claims List, Right Interactive Verification Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Claims Ledger Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#DED2C5] flex flex-col">
          {/* Filter and Search Sub-bar */}
          <div className="p-3 border-b border-[#DED2C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#F5EFE6]/30">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#786A61] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims, populations, quotes..."
                className="w-full bg-[#FFFDF9] border border-[#DED2C5] text-xs py-1 pl-8 pr-3 text-[#391E1D] placeholder-[#786A61] rounded-xs focus:outline-none focus:border-[#74191D]"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono">
              {['ALL', 'FLAGGED', 'BLOCKED', 'READY_FOR_HUMAN_REVIEW', 'HUMAN_APPROVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-1 rounded-xs transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#391E1D] text-[#FFFDF9] font-semibold'
                      : 'text-[#786A61] hover:text-[#391E1D] hover:bg-[#F5EFE6]'
                  }`}
                >
                  {status === 'READY_FOR_HUMAN_REVIEW'
                    ? 'Pending'
                    : status === 'HUMAN_APPROVED'
                    ? 'Approved'
                    : status}
                </button>
              ))}
            </div>
          </div>

          {/* Claims List Rows */}
          <div className="divide-y divide-[#DED2C5] max-h-[750px] overflow-y-auto">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => {
                const isSelected = activeClaim?.claim_id === claim.claim_id;
                const hasBlockers = claim.validation_findings?.some((f) => f.severity === 'BLOCKER');
                const hasFlags = claim.validation_findings?.some((f) => f.severity === 'FLAG');

                return (
                  <div
                    key={claim.claim_id}
                    onClick={() => handleSelectClaimRecord(claim)}
                    className={`p-4 transition-colors cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-[#F7E9DE]/40 border-l-3 border-[#74191D]'
                        : 'hover:bg-[#F5EFE6]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                            claim.review_status === 'HUMAN_APPROVED'
                              ? 'bg-[#416C49]/15 text-[#416C49]'
                              : claim.review_status === 'FLAGGED'
                              ? 'bg-[#BB4B2D]/15 text-[#BB4B2D]'
                              : claim.review_status === 'BLOCKED'
                              ? 'bg-[#74191D]/15 text-[#74191D]'
                              : 'bg-[#DED2C5] text-[#391E1D]'
                          }`}
                        >
                          {claim.review_status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-[#786A61]">
                          ID: {claim.claim_id.substring(0, 16)}...
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#786A61]">
                        {claim.study_design}
                      </span>
                    </div>

                    <p className="font-serif text-sm font-semibold text-[#391E1D] leading-snug">
                      {claim.claim_text}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#786A61]">
                      <span className="truncate max-w-[260px]">
                        Pop: {claim.population}
                      </span>

                      {hasBlockers ? (
                        <span className="text-[#74191D] font-mono text-[10px] flex items-center gap-1 font-semibold">
                          <XCircle className="w-3 h-3" /> Blocker Detected
                        </span>
                      ) : hasFlags ? (
                        <span className="text-[#BB4B2D] font-mono text-[10px] flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Flagged Finding
                        </span>
                      ) : (
                        <span className="text-[#416C49] font-mono text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#786A61]">
                No claims match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Evidence Verification Deck (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#DED2C5] p-5 space-y-5 sticky top-20">
          {activeClaim ? (
            <>
              {/* Header: Title and Status */}
              <div className="flex items-center justify-between border-b border-[#DED2C5] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                  EVIDENCE VERIFICATION DECK
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold ${
                    activeClaim.review_status === 'HUMAN_APPROVED'
                      ? 'bg-[#416C49]/15 text-[#416C49]'
                      : activeClaim.review_status === 'FLAGGED'
                      ? 'bg-[#BB4B2D]/15 text-[#BB4B2D]'
                      : activeClaim.review_status === 'BLOCKED'
                      ? 'bg-[#74191D]/15 text-[#74191D]'
                      : 'bg-[#DED2C5] text-[#391E1D]'
                  }`}
                >
                  {activeClaim.review_status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Claim Statement */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  ACTIVE CLAIM STATEMENT
                </span>
                <div className="p-3 bg-[#F5EFE6]/60 border-l-2 border-[#74191D] font-serif text-sm font-semibold text-[#391E1D] leading-snug">
                  {activeClaim.claim_text}
                </div>
              </div>

              {/* Verbatim Supporting Passage with Restrained Warm Highlight */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                    <Quote className="w-3 h-3 text-[#BB4B2D]" />
                    VERBATIM SOURCE EVIDENCE
                  </span>
                  {linkedPassage && (
                    <button
                      onClick={() => onViewSourcePassage(linkedPassage.evidence_id)}
                      className="text-[10px] font-mono text-[#74191D] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <span>p. {linkedPassage.pdf_page_index} ({linkedPassage.section})</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#F7E9DE]/80 border border-[#DED2C5] font-serif text-xs italic text-[#391E1D] leading-relaxed">
                  "{activeClaim.exact_supporting_quote || linkedPassage?.verbatim_text || 'No verbatim quote found.'}"
                </div>
              </div>

              {/* Methodology Matrix */}
              <div className="border-t border-[#DED2C5] pt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-[#DED2C5]/70 bg-[#F5EFE6]/30">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] block">Cohort / Population</span>
                  <span className="font-medium text-[#391E1D] block mt-0.5">{activeClaim.population}</span>
                </div>
                <div className="p-2 border border-[#DED2C5]/70 bg-[#F5EFE6]/30">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] block">Study Design</span>
                  <span className="font-medium text-[#391E1D] block mt-0.5">{activeClaim.study_design}</span>
                </div>
              </div>

              {/* Deterministic Validation Engine Findings */}
              <div className="border-t border-[#DED2C5] pt-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  12-RULE VALIDATION STATUS
                </span>

                {activeClaim.validation_findings && activeClaim.validation_findings.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeClaim.validation_findings.map((f, i) => (
                      <div
                        key={i}
                        className={`p-2.5 text-xs rounded-xs border space-y-1 ${
                          f.severity === 'BLOCKER'
                            ? 'bg-[#74191D]/5 border-[#74191D]/30 text-[#74191D]'
                            : 'bg-[#BB4B2D]/5 border-[#BB4B2D]/30 text-[#BB4B2D]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase">
                          <span>{f.rule_id}</span>
                          <span>{f.severity}</span>
                        </div>
                        <p className="text-[#391E1D] font-medium leading-snug">{f.reason}</p>
                        <p className="text-[10px] font-mono text-[#786A61]">
                          Fix: {f.recommended_action}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#416C49]/5 border border-[#416C49]/20 text-[#416C49] text-xs flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>All deterministic checks passed cleanly.</span>
                  </div>
                )}
              </div>

              {/* Human Editorial Decision Bar */}
              <div className="border-t border-[#DED2C5] pt-4 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  REVIEWER DECISION
                </span>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleApprove(activeClaim)}
                    className="w-full py-2.5 px-3 text-xs font-semibold bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign Off & Approve Claim (Doctor Verified)</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const note = prompt(
                          'Enter reviewer flag note:',
                          activeClaim.reviewer_note || ''
                        );
                        if (note !== null) handleFlag(activeClaim, note);
                      }}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#BB4B2D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Flag</span>
                    </button>

                    <button
                      onClick={() => setEditingClaim(activeClaim)}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#391E1D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-[#786A61]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleReject(activeClaim)}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#74191D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAuditSingleClaimViaGemini(activeClaim)}
                    disabled={isAuditingClaims}
                    className="w-full py-2 px-3 text-xs font-semibold bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Audit this individual claim with Gemini 3.8 Flash against verbatim source passages"
                  >
                    {isAuditingClaims ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
                    )}
                    <span>Audit This Claim (Gemini 3.8 Flash)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#786A61]">
              Select a claim to inspect evidence.
            </div>
          )}
        </div>
      </div>

      {/* 03. Edit Claim Statement Modal */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-[#391E1D]/50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#DED2C5] max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#DED2C5] pb-2">
              <h3 className="font-serif font-bold text-base text-[#391E1D]">
                Edit Claim Statement
              </h3>
              <button
                onClick={() => setEditingClaim(null)}
                className="text-[#786A61] hover:text-[#391E1D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Claim Text
                </label>
                <textarea
                  value={editingClaim.claim_text}
                  onChange={(e) =>
                    setEditingClaim({ ...editingClaim, claim_text: e.target.value })
                  }
                  rows={3}
                  className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs focus:outline-none focus:border-[#74191D]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Exact Supporting Quote
                </label>
                <textarea
                  value={editingClaim.exact_supporting_quote}
                  onChange={(e) =>
                    setEditingClaim({
                      ...editingClaim,
                      exact_supporting_quote: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs focus:outline-none focus:border-[#74191D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                    Population
                  </label>
                  <input
                    type="text"
                    value={editingClaim.population}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, population: e.target.value })
                    }
                    className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                    Study Design
                  </label>
                  <input
                    type="text"
                    value={editingClaim.study_design}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, study_design: e.target.value })
                    }
                    className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#DED2C5]">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-3 py-1.5 border border-[#DED2C5] hover:bg-[#F5EFE6] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] text-xs font-semibold cursor-pointer"
                >
                  Save & Re-validate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 04. Formulate Manual Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 bg-[#391E1D]/50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#DED2C5] max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#DED2C5] pb-2">
              <h3 className="font-serif font-bold text-base text-[#391E1D]">
                Formulate New Factual Claim
              </h3>
              <button
                onClick={() => setShowNewClaimModal(false)}
                className="text-[#786A61] hover:text-[#391E1D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualClaim} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Source Evidence Passage
                </label>
                <select
                  value={newSelectedEvidenceId}
                  onChange={(e) => {
                    setNewSelectedEvidenceId(e.target.value);
                    const selected = paperPassages.find((p) => p.evidence_id === e.target.value);
                    if (selected) {
                      setNewQuote(selected.verbatim_text.substring(0, 180));
                    }
                  }}
                  className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs"
                  required
                >
                  <option value="">Select source passage...</option>
                  {paperPassages.map((p) => (
                    <option key={p.evidence_id} value={p.evidence_id}>
                      Page {p.pdf_page_index} ({p.section}): {p.verbatim_text.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Factual Health Claim Statement
                </label>
                <textarea
                  value={newClaimText}
                  onChange={(e) => setNewClaimText(e.target.value)}
                  placeholder="e.g. In resistance-trained young men, 14 days of supplementation was associated with a 28% lower CK..."
                  rows={3}
                  className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs focus:outline-none focus:border-[#74191D]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Verbatim Source Quote
                </label>
                <textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-[#FFFDF9] border border-[#DED2C5] text-xs rounded-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#DED2C5]">
                <button
                  type="button"
                  onClick={() => setShowNewClaimModal(false)}
                  className="px-3 py-1.5 border border-[#DED2C5] hover:bg-[#F5EFE6] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] text-xs font-semibold cursor-pointer"
                >
                  Create & Run Validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
