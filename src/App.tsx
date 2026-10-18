import React, { useState, useEffect } from 'react';
import {
  CarouselContent,
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  ScheduledPost,
  StaticPostContent,
} from './types';
import {
  getActivePaperId,
  getSavedCarousels,
  getSavedClaims,
  getSavedPapers,
  getSavedPassages,
  getSavedReels,
  getSavedScheduledPosts,
  getSavedStaticPosts,
  resetToDemoWorkspace,
  saveCarousels,
  saveClaims,
  savePapers,
  savePassages,
  saveReels,
  saveScheduledPosts,
  saveStaticPosts,
  setActivePaperId,
} from './utils/storage';
import { runValidationEngine } from './utils/validationEngine';
import { useAuth } from './context/AuthContext';
import {
  fetchUserDataFromSql,
  savePaperToSql,
  deletePaperFromSql,
  saveClaimToSql,
  deleteClaimFromSql,
  saveDeliverableToSql,
  seedDemoToSql,
} from './utils/sqlApiClient';
import { NavigationSidebar, ActiveTab } from './components/NavigationSidebar';
import { TopBar } from './components/TopBar';
import { ContextInspector } from './components/ContextInspector';
import { Workspace } from './components/Workspace';
import { InvestigationDesk } from './components/InvestigationDesk';
import { ProvenanceGraph } from './components/ProvenanceGraph';
import { PaperIntake } from './components/PaperIntake';
import { EvidenceViewer } from './components/EvidenceViewer';
import { ClaimLedger } from './components/ClaimLedger';
import { ContentStudio } from './components/ContentStudio';
import { PostScheduler } from './components/PostScheduler';
import { SubmissionPacket } from './components/SubmissionPacket';
import { EvidenceReportView } from './components/EvidenceReportView';
import { SelfTestRunner } from './components/SelfTestRunner';
import { propagateClaimChange } from './utils/impactAnalysis';

export default function App() {
  const { user, idToken } = useAuth();

  const [currentTab, setCurrentTab] = useState<ActiveTab>('workspace');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Persistence State
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [activePaperId, setActivePaperIdState] = useState<string>('');
  const [passages, setPassages] = useState<EvidencePassage[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [carousels, setCarousels] = useState<CarouselContent[]>([]);
  const [staticPosts, setStaticPosts] = useState<StaticPostContent[]>([]);
  const [reels, setReels] = useState<ReelContent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  // Selection & Inspector State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [highlightEvidenceId, setHighlightEvidenceId] = useState<string | null>(null);
  const [sqlSyncStatus, setSqlSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Initialize from LocalStorage
  useEffect(() => {
    const loadedPapers = getSavedPapers();
    const loadedPassages = getSavedPassages();
    const loadedClaims = getSavedClaims();
    const loadedCarousels = getSavedCarousels();
    const loadedStatic = getSavedStaticPosts();
    const loadedReels = getSavedReels();
    const loadedScheduled = getSavedScheduledPosts();
    const loadedActiveId = getActivePaperId();

    setPapers(loadedPapers);
    setPassages(loadedPassages);
    setClaims(loadedClaims);
    setCarousels(loadedCarousels);
    setStaticPosts(loadedStatic);
    setReels(loadedReels);
    setScheduledPosts(loadedScheduled);
    setActivePaperIdState(loadedActiveId || loadedPapers[0]?.paper_id || '');
    if (loadedClaims.length > 0) {
      setSelectedClaimId(loadedClaims[0].claim_id);
    }
  }, []);

  // Sync with Cloud SQL PostgreSQL when user is authenticated with Google
  useEffect(() => {
    if (!idToken) {
      setSqlSyncStatus('offline');
      return;
    }

    let isMounted = true;
    setSqlSyncStatus('syncing');

    fetchUserDataFromSql(idToken)
      .then(async (data) => {
        if (!isMounted) return;
        if (data.papers.length > 0) {
          setPapers(data.papers);
          setPassages(data.passages);
          setClaims(data.claims);
          setCarousels(data.carousels);
          setStaticPosts(data.staticPosts);
          setReels(data.reels);
          setActivePaperIdState(data.papers[0].paper_id);
          savePapers(data.papers);
          savePassages(data.passages);
          saveClaims(data.claims);
          saveCarousels(data.carousels);
          saveStaticPosts(data.staticPosts);
          saveReels(data.reels);
          if (data.claims.length > 0) {
            setSelectedClaimId(data.claims[0].claim_id);
          }
          setSqlSyncStatus('synced');
        } else {
          const localPapers = getSavedPapers();
          if (localPapers.length > 0) {
            const localPassages = getSavedPassages();
            const localClaims = getSavedClaims();
            for (const p of localPapers) {
              await savePaperToSql(
                idToken,
                p,
                localPassages.filter((pass) => pass.paper_id === p.paper_id)
              );
            }
            for (const c of localClaims) {
              await saveClaimToSql(idToken, c);
            }
          }
          setSqlSyncStatus('synced');
        }
      })
      .catch((err) => {
        console.error('Cloud SQL sync error:', err);
        if (isMounted) setSqlSyncStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [idToken]);

  const activePaper = papers.find((p) => p.paper_id === activePaperId) || papers[0] || null;

  // Active deliverables
  const activeCarousel =
    carousels.find((c) => c.paper_id === activePaper?.paper_id) || carousels[0] || null;
  const activeStaticPost =
    staticPosts.find((s) => s.paper_id === activePaper?.paper_id) || staticPosts[0] || null;
  const activeReel =
    reels.find((r) => r.paper_id === activePaper?.paper_id) || reels[0] || null;

  const currentPaperClaims = activePaper
    ? claims.filter((c) => c.paper_id === activePaper.paper_id)
    : [];
  const currentPaperPassages = activePaper
    ? passages.filter((p) => p.paper_id === activePaper.paper_id)
    : [];

  const approvedClaims = currentPaperClaims.filter((c) => c.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = currentPaperClaims.filter((c) => c.review_status === 'FLAGGED');

  // Currently inspected claim and evidence passage
  const inspectedClaim =
    currentPaperClaims.find((c) => c.claim_id === selectedClaimId) ||
    currentPaperClaims[0] ||
    null;

  const inspectedPassage =
    currentPaperPassages.find((p) =>
      highlightEvidenceId
        ? p.evidence_id === highlightEvidenceId
        : inspectedClaim?.evidence_ids.includes(p.evidence_id)
    ) ||
    currentPaperPassages[0] ||
    null;

  // Handlers
  const handleAddPaper = (newPaper: PaperRecord, newPassages: EvidencePassage[]) => {
    const updatedPapers = [newPaper, ...papers.filter((p) => p.paper_id !== newPaper.paper_id)];
    const updatedPassages = [
      ...newPassages,
      ...passages.filter((p) => p.paper_id !== newPaper.paper_id),
    ];

    setPapers(updatedPapers);
    setPassages(updatedPassages);
    setActivePaperIdState(newPaper.paper_id);

    savePapers(updatedPapers);
    savePassages(updatedPassages);
    setActivePaperId(newPaper.paper_id);

    if (idToken) {
      savePaperToSql(idToken, newPaper, newPassages).catch((err) =>
        console.error('Failed to save paper to Cloud SQL:', err)
      );
    }

    setCurrentTab('evidence');
  };

  const handleUpdatePaper = (updatedPaper: PaperRecord) => {
    const updated = papers.map((p) => (p.paper_id === updatedPaper.paper_id ? updatedPaper : p));
    setPapers(updated);
    savePapers(updated);

    if (idToken) {
      const relatedPassages = passages.filter((p) => p.paper_id === updatedPaper.paper_id);
      savePaperToSql(idToken, updatedPaper, relatedPassages).catch((err) =>
        console.error('Failed to update paper in Cloud SQL:', err)
      );
    }
  };

  const handleDeletePaper = (paperId: string) => {
    const remaining = papers.filter((p) => p.paper_id !== paperId);
    const remainingPassages = passages.filter((p) => p.paper_id !== paperId);
    const remainingClaims = claims.filter((c) => c.paper_id !== paperId);

    setPapers(remaining);
    setPassages(remainingPassages);
    setClaims(remainingClaims);

    savePapers(remaining);
    savePassages(remainingPassages);
    saveClaims(remainingClaims);

    if (idToken) {
      deletePaperFromSql(idToken, paperId).catch((err) =>
        console.error('Failed to delete paper in Cloud SQL:', err)
      );
    }

    if (activePaperId === paperId && remaining.length > 0) {
      setActivePaperIdState(remaining[0].paper_id);
      setActivePaperId(remaining[0].paper_id);
    }
  };

  const handleSwitchPaper = (paperId: string) => {
    setActivePaperIdState(paperId);
    setActivePaperId(paperId);
    const paperClms = claims.filter((c) => c.paper_id === paperId);
    if (paperClms.length > 0) {
      setSelectedClaimId(paperClms[0].claim_id);
    }
  };

  const handleUpdateClaim = (updatedClaim: ClaimRecord, wasApprovedEdited: boolean) => {
    const { findings, checks, calculatedStatus } = runValidationEngine(
      updatedClaim,
      passages.filter((p) => p.paper_id === updatedClaim.paper_id),
      claims
    );

    const revalidated: ClaimRecord = {
      ...updatedClaim,
      validation_findings: findings,
      validation_checks: checks,
      review_status:
        updatedClaim.review_status === 'HUMAN_APPROVED' && !wasApprovedEdited
          ? 'HUMAN_APPROVED'
          : calculatedStatus,
    };

    const previousClaim = claims.find((c) => c.claim_id === updatedClaim.claim_id);

    const updatedClaims = claims.map((c) =>
      c.claim_id === updatedClaim.claim_id ? revalidated : c
    );
    setClaims(updatedClaims);
    saveClaims(updatedClaims);

    if (idToken) {
      saveClaimToSql(idToken, revalidated).catch((err) =>
        console.error('Failed to update claim in Cloud SQL:', err)
      );
    }

    // Change impact analysis: propagate invalidations to downstream deliverables
    const { updatedCarousels, updatedStaticPosts, updatedReels } = propagateClaimChange(
      revalidated,
      previousClaim,
      {
        carousels,
        staticPosts,
        reels,
      }
    );

    setCarousels(updatedCarousels);
    setStaticPosts(updatedStaticPosts);
    setReels(updatedReels);

    saveCarousels(updatedCarousels);
    saveStaticPosts(updatedStaticPosts);
    saveReels(updatedReels);

    if (idToken && activePaper) {
      const affectedC = updatedCarousels.find((c) => c.paper_id === activePaper.paper_id);
      if (affectedC) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'CAROUSEL', affectedC.id, affectedC).catch(console.error);
      }
      const affectedS = updatedStaticPosts.find((s) => s.paper_id === activePaper.paper_id);
      if (affectedS) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'STATIC', affectedS.id, affectedS).catch(console.error);
      }
      const affectedR = updatedReels.find((r) => r.paper_id === activePaper.paper_id);
      if (affectedR) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'REEL', affectedR.id, affectedR).catch(console.error);
      }
    }
  };

  const handleAddClaim = (newClaim: ClaimRecord) => {
    const { findings, checks, calculatedStatus } = runValidationEngine(
      newClaim,
      passages.filter((p) => p.paper_id === newClaim.paper_id),
      claims
    );

    const validated: ClaimRecord = {
      ...newClaim,
      validation_findings: findings,
      validation_checks: checks,
      review_status: calculatedStatus,
    };

    const updated = [validated, ...claims];
    setClaims(updated);
    saveClaims(updated);
    setSelectedClaimId(validated.claim_id);

    if (idToken) {
      saveClaimToSql(idToken, validated).catch((err) =>
        console.error('Failed to save claim in Cloud SQL:', err)
      );
    }
  };

  const handleBatchAddClaims = (newClaims: ClaimRecord[]) => {
    const validatedBatch = newClaims.map((claim) => {
      const { findings, checks, calculatedStatus } = runValidationEngine(
        claim,
        passages.filter((p) => p.paper_id === claim.paper_id),
        claims
      );
      return {
        ...claim,
        validation_findings: findings,
        validation_checks: checks,
        review_status: calculatedStatus,
      };
    });

    const updated = [...validatedBatch, ...claims];
    setClaims(updated);
    saveClaims(updated);
    if (validatedBatch.length > 0) {
      setSelectedClaimId(validatedBatch[0].claim_id);
    }

    if (idToken) {
      for (const c of validatedBatch) {
        saveClaimToSql(idToken, c).catch((err) =>
          console.error('Failed to batch save claim in Cloud SQL:', err)
        );
      }
    }
  };

  const handleDeleteClaim = (claimId: string) => {
    const updated = claims.filter((c) => c.claim_id !== claimId);
    setClaims(updated);
    saveClaims(updated);
    if (selectedClaimId === claimId) {
      setSelectedClaimId(updated[0]?.claim_id || null);
    }

    if (idToken) {
      deleteClaimFromSql(idToken, claimId).catch((err) =>
        console.error('Failed to delete claim from Cloud SQL:', err)
      );
    }
  };

  const handleGenerateAllContent = async () => {
    if (!activePaper) return;
    if (approvedClaims.length === 0) {
      alert('Cannot generate content without human-approved claims.');
      return;
    }

    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_id: activePaper.paper_id,
        paper_title: activePaper.title,
        approved_claims: approvedClaims,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate deliverables from server.');
    }

    if (data.carousel) {
      const updatedCarousels = [
        data.carousel,
        ...carousels.filter((c) => c.paper_id !== activePaper.paper_id),
      ];
      setCarousels(updatedCarousels);
      saveCarousels(updatedCarousels);

      if (idToken) {
        saveDeliverableToSql(
          idToken,
          activePaper.paper_id,
          'CAROUSEL',
          data.carousel.id,
          data.carousel
        ).catch((err) => console.error('Cloud SQL deliverable error:', err));
      }
    }

    if (data.static_post) {
      const updatedPosts = [
        data.static_post,
        ...staticPosts.filter((s) => s.paper_id !== activePaper.paper_id),
      ];
      setStaticPosts(updatedPosts);
      saveStaticPosts(updatedPosts);

      if (idToken) {
        saveDeliverableToSql(
          idToken,
          activePaper.paper_id,
          'STATIC',
          data.static_post.id,
          data.static_post
        ).catch((err) => console.error('Cloud SQL deliverable error:', err));
      }
    }

    if (data.reel) {
      const updatedReels = [
        data.reel,
        ...reels.filter((r) => r.paper_id !== activePaper.paper_id),
      ];
      setReels(updatedReels);
      saveReels(updatedReels);

      if (idToken) {
        saveDeliverableToSql(
          idToken,
          activePaper.paper_id,
          'REEL',
          data.reel.id,
          data.reel
        ).catch((err) => console.error('Cloud SQL deliverable error:', err));
      }
    }
  };

  const handleResetDemo = () => {
    if (confirm('Reset workspace to the metabolic health research dataset (GLP-1, South Asian phenotype, adaptive thermogenesis)?')) {
      const demoData = resetToDemoWorkspace();
      setPapers(demoData.papers);
      setPassages(demoData.passages);
      setClaims(demoData.claims);
      setCarousels(demoData.carousels);
      setStaticPosts(demoData.staticPosts);
      setReels(demoData.reels);
      setScheduledPosts(demoData.scheduledPosts);
      setActivePaperIdState(demoData.papers[0].paper_id);
      setSelectedClaimId(demoData.claims[0].claim_id);
      setCurrentTab('workspace');

      if (idToken) {
        seedDemoToSql(idToken).catch((err) =>
          console.error('Failed to seed demo into Cloud SQL:', err)
        );
      }
    }
  };

  const handleViewSourcePassage = (evidenceId: string) => {
    setHighlightEvidenceId(evidenceId);
    setCurrentTab('evidence');
    setTimeout(() => {
      const el = document.getElementById(evidenceId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSelectClaim = (claim: ClaimRecord) => {
    setSelectedClaimId(claim.claim_id);
    setIsInspectorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#391E1D] flex">
      {/* 01. LEFT: Persistent Desktop Navigation Rail (228px) */}
      <NavigationSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activePaper={activePaper}
        papers={papers}
        onSwitchPaper={handleSwitchPaper}
        approvedClaimsCount={approvedClaims.length}
        totalClaimsCount={currentPaperClaims.length}
        flaggedClaimsCount={flaggedClaims.length}
        sqlSyncStatus={sqlSyncStatus}
        onOpenDemo={handleResetDemo}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#391E1D]/40 md:hidden"
        />
      )}

      {/* 02. CENTER & RIGHT: Main Workstation Area (offset by 228px on desktop) */}
      <div className="flex-1 md:ml-[228px] flex flex-col min-h-screen min-w-0">
        {/* Top Header Bar across canvas */}
        <TopBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activePaper={activePaper}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          sqlSyncStatus={sqlSyncStatus}
          quickActionLabel={
            currentTab === 'workspace'
              ? 'Investigation Desk'
              : currentTab === 'desk'
              ? 'Provenance Graph'
              : currentTab === 'graph'
              ? 'Investigation Desk'
              : currentTab === 'papers'
              ? 'Select PDF'
              : currentTab === 'review'
              ? 'Extract Claims'
              : currentTab === 'studio'
              ? 'Generate Content'
              : currentTab === 'schedule'
              ? 'Submission Packet'
              : currentTab === 'submission'
              ? 'Content Calendar'
              : undefined
          }
          onQuickAction={
            currentTab === 'workspace'
              ? () => setCurrentTab('desk')
              : currentTab === 'desk'
              ? () => setCurrentTab('graph')
              : currentTab === 'graph'
              ? () => setCurrentTab('desk')
              : currentTab === 'papers'
              ? () => setCurrentTab('papers')
              : currentTab === 'review'
              ? undefined
              : currentTab === 'studio'
              ? handleGenerateAllContent
              : currentTab === 'schedule'
              ? () => setCurrentTab('submission')
              : currentTab === 'submission'
              ? () => setCurrentTab('schedule')
              : undefined
          }
        />

        {/* 03. Split Work Canvas: Center Content + Right Contextual Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* CENTER: The Dominant Working Canvas */}
          <main className="flex-1 min-w-0 overflow-y-auto pb-16">
            {currentTab === 'workspace' && (
              <Workspace
                papers={papers}
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onNavigate={setCurrentTab}
                onOpenDemo={handleResetDemo}
                onSwitchPaper={handleSwitchPaper}
                onSelectClaimForReview={handleSelectClaim}
              />
            )}

            {currentTab === 'desk' && (
              <InvestigationDesk
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onUpdateClaim={handleUpdateClaim}
                onAddClaim={handleAddClaim}
                onNavigateToStudio={() => setCurrentTab('studio')}
                initialSelectedClaimId={selectedClaimId}
                initialSelectedEvidenceId={highlightEvidenceId}
              />
            )}

            {currentTab === 'graph' && (
              <ProvenanceGraph
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onNavigateToDesk={(claimId, evidenceId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  if (evidenceId) setHighlightEvidenceId(evidenceId);
                  setCurrentTab('desk');
                }}
                onNavigateToStudio={() => setCurrentTab('studio')}
              />
            )}

            {currentTab === 'papers' && (
              <PaperIntake
                papers={papers}
                activePaper={activePaper}
                passages={passages}
                onAddPaper={handleAddPaper}
                onUpdatePaper={handleUpdatePaper}
                onDeletePaper={handleDeletePaper}
                onSelectPaper={handleSwitchPaper}
                onNavigateToEvidence={() => setCurrentTab('desk')}
              />
            )}

            {currentTab === 'evidence' && (
              <EvidenceViewer
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                highlightEvidenceId={highlightEvidenceId}
                onFormulateClaim={(passage) => {
                  setHighlightEvidenceId(passage.evidence_id);
                  setCurrentTab('desk');
                }}
                onNavigateToReview={() => setCurrentTab('review')}
              />
            )}

            {currentTab === 'review' && (
              <ClaimLedger
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                selectedClaimId={selectedClaimId}
                onSelectClaim={handleSelectClaim}
                onUpdateClaim={handleUpdateClaim}
                onAddClaim={handleAddClaim}
                onDeleteClaim={handleDeleteClaim}
                onBatchAddClaims={handleBatchAddClaims}
                onViewSourcePassage={handleViewSourcePassage}
                onNavigateToStudio={() => setCurrentTab('studio')}
              />
            )}

            {currentTab === 'studio' && (
              <ContentStudio
                activePaper={activePaper}
                approvedClaims={approvedClaims}
                allClaims={currentPaperClaims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onUpdateCarousel={(updated) => {
                  const updatedCarousels = carousels.map((c) =>
                    c.id === updated.id ? updated : c
                  );
                  setCarousels(updatedCarousels);
                  saveCarousels(updatedCarousels);
                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'CAROUSEL',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onUpdateStaticPost={(updated) => {
                  const updatedPosts = staticPosts.map((s) =>
                    s.id === updated.id ? updated : s
                  );
                  setStaticPosts(updatedPosts);
                  saveStaticPosts(updatedPosts);
                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'STATIC',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onUpdateReel={(updated) => {
                  const updatedReels = reels.map((r) => (r.id === updated.id ? updated : r));
                  setReels(updatedReels);
                  saveReels(updatedReels);
                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'REEL',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onGenerateAllContent={handleGenerateAllContent}
                onNavigateToReview={() => setCurrentTab('review')}
                onNavigateToDesk={(claimId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  setCurrentTab('desk');
                }}
              />
            )}

            {currentTab === 'schedule' && (
              <PostScheduler
                papers={papers}
                activePaper={activePaper}
                scheduledPosts={scheduledPosts}
                onUpdateScheduledPosts={(updated) => {
                  setScheduledPosts(updated);
                  saveScheduledPosts(updated);
                }}
                onNavigateToStudio={(tab, targetPaperId) => {
                  if (targetPaperId) {
                    setActivePaperIdState(targetPaperId);
                    setActivePaperId(targetPaperId);
                  }
                  setCurrentTab('studio');
                }}
                carousels={carousels}
                staticPosts={staticPosts}
                reels={reels}
              />
            )}

            {currentTab === 'submission' && (
              <SubmissionPacket
                papers={papers}
                carousels={carousels}
                staticPosts={staticPosts}
                reels={reels}
                onNavigateToStudio={(tab, targetPaperId) => {
                  if (targetPaperId) {
                    setActivePaperIdState(targetPaperId);
                    setActivePaperId(targetPaperId);
                  }
                  setCurrentTab('studio');
                }}
                onNavigateToDesk={(claimId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  setCurrentTab('desk');
                }}
                onNavigateToSchedule={() => setCurrentTab('schedule')}
              />
            )}

            {currentTab === 'report' && (
              <EvidenceReportView
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
              />
            )}

            {currentTab === 'selftest' && <SelfTestRunner />}
          </main>

          {/* 04. RIGHT: Contextual Inspector (310px where viewport allows) */}
          {['workspace', 'evidence', 'review'].includes(currentTab) && isInspectorOpen && (
            <div className="hidden xl:block">
              <ContextInspector
                selectedClaim={inspectedClaim}
                evidencePassage={inspectedPassage}
                activePaper={activePaper}
                isOpen={isInspectorOpen}
                onClose={() => setIsInspectorOpen(false)}
                onApproveClaim={(c) => {
                  handleUpdateClaim(
                    {
                      ...c,
                      review_status: 'HUMAN_APPROVED',
                      approved_version: {
                        claim_text: c.claim_text,
                        approved_at: new Date().toISOString(),
                        approved_by: 'Inspector Reviewer',
                      },
                    },
                    false
                  );
                }}
                onFlagClaim={(c, note) => {
                  handleUpdateClaim({ ...c, review_status: 'FLAGGED', reviewer_note: note }, c.review_status === 'HUMAN_APPROVED');
                }}
                onRejectClaim={(c) => {
                  handleUpdateClaim({ ...c, review_status: 'REJECTED' }, c.review_status === 'HUMAN_APPROVED');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
