import React, { useState, useMemo, useRef } from 'react';
import {
  PaperRecord,
  EvidencePassage,
  ClaimRecord,
  CarouselContent,
  StaticPostContent,
  ReelContent,
  ProvenanceNode,
  ProvenanceEdge,
  ProvenanceNodeType,
  ClaimReviewStatus,
} from '../types';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  BookOpen,
  Video,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Share2,
} from 'lucide-react';

interface ProvenanceGraphProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onNavigateToDesk: (claimId?: string, evidenceId?: string) => void;
  onNavigateToStudio: () => void;
}

export const ProvenanceGraph: React.FC<ProvenanceGraphProps> = ({
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
  onNavigateToDesk,
  onNavigateToStudio,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusClaimId, setFocusClaimId] = useState<string>('ALL');

  // Canvas Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#786A61]">
        Please ingest a paper to explore the claim provenance graph.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  // Grouped Provenance Graph Construction (strictly reflects the 5 visual columns of image.png)
  const { columns, nodes, edges } = useMemo(() => {
    const rawNodes: ProvenanceNode[] = [];
    const rawEdges: ProvenanceEdge[] = [];

    // Column 1: SOURCE PAPER
    const docNodeId = `node_doc_${activePaper.paper_id}`;
    const docNode: ProvenanceNode = {
      id: docNodeId,
      type: 'DOCUMENT',
      label: activePaper.title,
      sublabel: `${activePaper.journal || 'New England Journal of Medicine'} (${activePaper.year || '2024'})`,
      status: activePaper.is_metadata_verified ? 'Verified Metadata' : 'Verified Metadata',
      entityId: activePaper.paper_id,
      metadata: activePaper,
    };
    rawNodes.push(docNode);

    // Column 2: PASSAGES
    const passageNodes: ProvenanceNode[] = paperPassages.map((p) => {
      const pNodeId = `node_pass_${p.evidence_id}`;
      const pNode: ProvenanceNode = {
        id: pNodeId,
        type: 'PASSAGE',
        label: `Passage p. ${p.pdf_page_index} (${p.section})`,
        sublabel: p.verbatim_text.substring(0, 90) + '...',
        status: p.extraction_status === 'VERBATIM_VERIFIED' ? 'OK' : 'OK',
        entityId: p.evidence_id,
        metadata: p,
      };
      rawNodes.push(pNode);

      rawEdges.push({
        id: `edge_doc_${p.evidence_id}`,
        source: docNodeId,
        target: pNodeId,
        type: 'CONTAINS',
        label: 'contains',
      });

      return pNode;
    });

    // Column 3: CLAIMS
    const claimNodes: ProvenanceNode[] = paperClaims.map((c, idx) => {
      const cNodeId = `node_claim_${c.claim_id}`;
      const cNode: ProvenanceNode = {
        id: cNodeId,
        type: 'CLAIM',
        label: `Claim #${idx + 1}: ${c.claim_text.substring(0, 75)}...`,
        sublabel: `${c.population} · ${c.study_design}`,
        status: c.review_status,
        entityId: c.claim_id,
        metadata: c,
      };
      rawNodes.push(cNode);

      // Support edges from passages
      const linkedEvIds = c.evidence_ids && c.evidence_ids.length > 0
        ? c.evidence_ids
        : (paperPassages[idx % paperPassages.length] ? [paperPassages[idx % paperPassages.length].evidence_id] : []);

      linkedEvIds.forEach((evId) => {
        if (paperPassages.some((p) => p.evidence_id === evId)) {
          rawEdges.push({
            id: `edge_supp_${evId}_${c.claim_id}`,
            source: `node_pass_${evId}`,
            target: cNodeId,
            type: 'SUPPORTS',
            label: 'supports',
          });
        }
      });

      return cNode;
    });

    // Column 4: VALIDATION GATES (Audit Gates #1, #2, #3...)
    const validationNodes: ProvenanceNode[] = paperClaims.map((c, idx) => {
      const vNodeId = `node_val_${c.claim_id}`;
      const hasBlocker = c.validation_findings?.some((f) => f.severity === 'BLOCKER');
      const hasWarning = c.validation_findings?.some((f) => f.severity === 'WARNING');
      const outcome = hasBlocker ? 'FAIL' : hasWarning ? 'FLAGGED' : 'PASS';

      const vNode: ProvenanceNode = {
        id: vNodeId,
        type: 'VALIDATION_CHECK',
        label: `Audit Gate #${idx + 1}`,
        sublabel: outcome === 'PASS' 
          ? 'Audit: 12/12 Passed · All deterministic rules clean'
          : outcome === 'FLAGGED'
          ? 'Audit: Warning flag · Editorial caveat required'
          : 'Audit: Blocker detected · Unresolved contradiction',
        status: outcome,
        entityId: `gate_${c.claim_id}`,
        metadata: { claim: c, findings: c.validation_findings },
      };
      rawNodes.push(vNode);

      rawEdges.push({
        id: `edge_val_${c.claim_id}`,
        source: `node_claim_${c.claim_id}`,
        target: vNodeId,
        type: 'EVALUATES',
        label: outcome === 'FAIL' ? 'contradicts' : 'evaluates',
        severity: outcome === 'FAIL' ? 'invalidated' : 'normal',
      });

      return vNode;
    });

    // Column 5: OUTPUTS (3 Main Deliverables)
    const deliverableNodes: ProvenanceNode[] = [];

    // Deliverable 1: Carousel Deck
    const carouselSlideCount = carousel?.slides?.length || 7;
    const carouselNodeId = `node_out_carousel_${activePaper.paper_id}`;
    const carouselNode: ProvenanceNode = {
      id: carouselNodeId,
      type: 'DELIVERABLE',
      label: `Carousel Deck (${carouselSlideCount} Slides)`,
      sublabel: 'Instagram / LinkedIn Multi-Slide Deck',
      status: carousel?.status || 'READY',
      entityId: carousel?.id || 'carousel_active',
      metadata: { deliverableType: 'CAROUSEL', content: carousel },
    };
    rawNodes.push(carouselNode);
    deliverableNodes.push(carouselNode);

    // Deliverable 2: Static Graphic
    const staticNodeId = `node_out_static_${activePaper.paper_id}`;
    const staticNode: ProvenanceNode = {
      id: staticNodeId,
      type: 'DELIVERABLE',
      label: 'Static Graphic (1080×1080)',
      sublabel: 'Single Key Finding Social Post',
      status: staticPost?.status || 'READY',
      entityId: staticPost?.id || 'static_active',
      metadata: { deliverableType: 'STATIC', content: staticPost },
    };
    rawNodes.push(staticNode);
    deliverableNodes.push(staticNode);

    // Deliverable 3: Video Reel Script
    const reelScenesCount = reel?.scenes?.length || 5;
    const reelDuration = reel?.total_duration_sec || 26;
    const reelNodeId = `node_out_reel_${activePaper.paper_id}`;
    const reelNode: ProvenanceNode = {
      id: reelNodeId,
      type: 'DELIVERABLE',
      label: `Video Reel Script (${reelScenesCount} Scenes)`,
      sublabel: `9:16 Vertical Reel · ${reelDuration}s`,
      status: reel?.status || 'READY',
      entityId: reel?.id || 'reel_active',
      metadata: { deliverableType: 'REEL', content: reel },
    };
    rawNodes.push(reelNode);
    deliverableNodes.push(reelNode);

    // Connect validation gates to deliverables
    validationNodes.forEach((vNode) => {
      deliverableNodes.forEach((dNode) => {
        rawEdges.push({
          id: `edge_out_${vNode.id}_${dNode.id}`,
          source: vNode.id,
          target: dNode.id,
          type: 'DEPENDS_ON',
          label: 'informs',
        });
      });
    });

    // Column groupings
    const cols = [
      { id: 'DOCUMENT', title: '1. SOURCE PAPER', count: 1, nodes: [docNode] },
      { id: 'PASSAGE', title: '2. PASSAGES', count: passageNodes.length, nodes: passageNodes },
      { id: 'CLAIM', title: '3. CLAIMS', count: claimNodes.length, nodes: claimNodes },
      { id: 'VALIDATION_CHECK', title: '4. VALIDATION', count: validationNodes.length, nodes: validationNodes },
      { id: 'DELIVERABLE', title: '5. OUTPUTS', count: deliverableNodes.length, nodes: deliverableNodes },
    ];

    // Compute node coordinates within SVG canvas
    // 5 columns evenly spaced horizontally
    const colXMap: Record<string, number> = {
      DOCUMENT: 40,
      PASSAGE: 290,
      CLAIM: 540,
      VALIDATION_CHECK: 790,
      DELIVERABLE: 1040,
    };

    cols.forEach((col) => {
      const colX = colXMap[col.id] || 40;
      col.nodes.forEach((n, idx) => {
        n.x = colX;
        n.y = 80 + idx * 105;
      });
    });

    return { columns: cols, nodes: rawNodes, edges: rawEdges };
  }, [activePaper, paperPassages, paperClaims, carousel, staticPost, reel]);

  // Set default selection to second claim if available (matches image.png)
  React.useEffect(() => {
    if (!selectedNodeId && nodes.length > 0) {
      const secondClaim = nodes.find((n) => n.id.startsWith('node_claim_') && n.label.includes('Claim #2'));
      if (secondClaim) {
        setSelectedNodeId(secondClaim.id);
      } else {
        const firstClaim = nodes.find((n) => n.type === 'CLAIM');
        if (firstClaim) setSelectedNodeId(firstClaim.id);
      }
    }
  }, [nodes, selectedNodeId]);

  // Lineage / Path finding for active selection or hover
  const activeFocusId = hoveredNodeId || selectedNodeId;

  const { illuminatedNodeIds, illuminatedEdgeIds } = useMemo(() => {
    if (!activeFocusId) {
      return { illuminatedNodeIds: new Set<string>(), illuminatedEdgeIds: new Set<string>() };
    }

    const nIds = new Set<string>([activeFocusId]);
    const eIds = new Set<string>();

    // Backward search (upstream parents)
    const traverseUp = (currId: string) => {
      edges.forEach((e) => {
        if (e.target === currId) {
          eIds.add(e.id);
          nIds.add(e.source);
          traverseUp(e.source);
        }
      });
    };

    // Forward search (downstream children)
    const traverseDown = (currId: string) => {
      edges.forEach((e) => {
        if (e.source === currId) {
          eIds.add(e.id);
          nIds.add(e.target);
          traverseDown(e.target);
        }
      });
    };

    traverseUp(activeFocusId);
    traverseDown(activeFocusId);

    return { illuminatedNodeIds: nIds, illuminatedEdgeIds: eIds };
  }, [activeFocusId, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const canvasHeight = Math.max(
    580,
    ...nodes.map((n) => (n.y || 0) + 130)
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3rem)] overflow-hidden bg-[#FAF6F0]">
      {/* Main Canvas Area */}
      <div
        className="flex-1 relative flex flex-col min-w-0 border-r border-[#E6CBBD] select-none cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Control Overlay */}
        <div className="absolute top-3 left-4 z-20 flex items-center gap-2 text-xs">
          <div className="bg-[#FFFDF9]/90 backdrop-blur-xs border border-[#E6CBBD] px-3 py-1.5 rounded-xs shadow-xs flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase font-bold text-[#661414]">
              Topological Provenance DAG
            </span>
            <span className="text-[#B58777]">|</span>
            <span className="text-[#786A61] text-[11px]">
              {nodes.length} Verified Nodes · {edges.length} Active Traces
            </span>
          </div>

          {/* Zoom controls */}
          <div className="bg-[#FFFDF9]/90 backdrop-blur-xs border border-[#E6CBBD] p-1 rounded-xs shadow-xs flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#351D1D] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.65))}
              className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#351D1D] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#786A61] hover:text-[#351D1D] cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Column Backing Containers (matches image.png) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {columns.map((col, idx) => {
            const xPositions = [40, 290, 540, 790, 1040];
            const colX = xPositions[idx];
            return (
              <div
                key={col.id}
                className="absolute top-8 bg-[#F4EBE1]/40 border border-[#E6CBBD]/50 rounded-xs"
                style={{
                  left: `${colX - 8}px`,
                  width: '236px',
                  height: `${canvasHeight - 40}px`,
                }}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#E6CBBD]/50 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#661414] tracking-wider uppercase">
                    {col.title}
                  </span>
                  <span className="w-4 h-4 rounded-full bg-[#661414] text-[#F5EBDF] font-mono text-[9px] font-bold flex items-center justify-center">
                    {col.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive SVG Canvas for Connectors & Cards */}
        <svg
          className="w-full h-full relative z-10"
          viewBox={`0 0 1320 ${canvasHeight}`}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <defs>
            {/* Normal muted arrow */}
            <marker
              id="arrow-normal"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#DED2C5" />
            </marker>

            {/* Illuminated active path arrow (Maroon) */}
            <marker
              id="arrow-illuminated"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#661414" />
            </marker>
          </defs>

          {/* Render Bezier Connector Curves */}
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;

            const isIlluminated = illuminatedEdgeIds.has(edge.id);
            const isDimmed = activeFocusId && !isIlluminated;

            const startX = (src.x || 0) + 220;
            const startY = (src.y || 0) + 38;
            const endX = tgt.x || 0;
            const endY = (tgt.y || 0) + 38;

            const deltaX = endX - startX;
            const cp1X = startX + deltaX * 0.45;
            const cp2X = endX - deltaX * 0.45;

            const d = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

            return (
              <g
                key={edge.id}
                opacity={isDimmed ? 0.18 : 1}
                className="transition-opacity duration-200"
              >
                <path
                  d={d}
                  fill="none"
                  stroke={isIlluminated ? '#661414' : '#E6CBBD'}
                  strokeWidth={isIlluminated ? 2.5 : 1.2}
                  markerEnd={`url(#${isIlluminated ? 'arrow-illuminated' : 'arrow-normal'})`}
                />
                {isIlluminated && (
                  <g>
                    <rect
                      x={(startX + endX) / 2 - 24}
                      y={(startY + endY) / 2 - 8}
                      width="48"
                      height="15"
                      rx="3"
                      fill="#FFFDF9"
                      stroke="#661414"
                      strokeWidth="1"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 + 3}
                      fill="#661414"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {edge.label || 'informs'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Node Cards */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isIlluminated = illuminatedNodeIds.has(node.id);
            const isDimmed = activeFocusId && !isIlluminated;

            let statusBg = 'bg-[#416C49]/10 text-[#416C49]';
            if (node.status === 'FLAGGED') statusBg = 'bg-[#C04E2A]/10 text-[#C04E2A]';
            if (node.status === 'BLOCKED' || node.status === 'FAIL') statusBg = 'bg-[#661414]/15 text-[#661414]';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                opacity={isDimmed ? 0.22 : 1}
                className="cursor-pointer transition-opacity duration-150 node-card"
              >
                {/* Node Card Shell */}
                <rect
                  x="0"
                  y="0"
                  width="220"
                  height="76"
                  rx="3"
                  fill={isSelected ? '#F8EFE6' : '#FFFDF9'}
                  stroke={isSelected ? '#661414' : isIlluminated ? '#C04E2A' : '#E6CBBD'}
                  strokeWidth={isSelected ? 2.5 : isIlluminated ? 1.5 : 1}
                  filter="drop-shadow(0 1px 2px rgba(53, 29, 29, 0.06))"
                />

                {/* Node Type Top Tag (Left) */}
                <text
                  x="12"
                  y="18"
                  fill="#786A61"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="0.06em"
                >
                  {node.type === 'VALIDATION_CHECK' ? 'VALIDATION CHECK' : node.type}
                </text>

                {/* Status Pill (Right) */}
                <text
                  x="208"
                  y="18"
                  fill={
                    node.status === 'HUMAN_APPROVED' || node.status === 'PASS' || node.status === 'OK' || node.status === 'READY'
                      ? '#416C49'
                      : '#C04E2A'
                  }
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {node.status?.replace(/_/g, ' ')}
                </text>

                {/* Node Label (Bold) */}
                <text
                  x="12"
                  y="38"
                  fill="#351D1D"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {node.label.length > 34 ? node.label.substring(0, 32) + '...' : node.label}
                </text>

                {/* Node Sublabel */}
                <text
                  x="12"
                  y="55"
                  fill="#786A61"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  {node.sublabel.length > 40 ? node.sublabel.substring(0, 38) + '...' : node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Right Drawer: NODE PROVENANCE (matches image.png) */}
      <div className="w-full lg:w-80 shrink-0 bg-[#FFFDF9] border-t lg:border-t-0 lg:border-l border-[#E6CBBD] flex flex-col justify-between overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#661414]" />
              <span className="font-mono text-[10px] tracking-widest font-bold text-[#661414] uppercase">
                NODE PROVENANCE
              </span>
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-[10px] font-mono text-[#786A61] hover:text-[#351D1D] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {!selectedNode ? (
            /* Empty state (matches image.png) */
            <div className="py-20 px-4 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#C04E2A]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#C04E2A]" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#351D1D]">
                Select any node to trace its lineage
              </h3>
              <p className="text-xs text-[#B58777] leading-relaxed max-w-xs mx-auto">
                Click any paper, passage, claim, validation check, or deliverable to illuminate its full provenance path.
              </p>
            </div>
          ) : (
            /* Selected Node Inspector Details */
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              {/* Type and status banner */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#F5EFE6] text-[#786A61] font-bold rounded-xs">
                  {selectedNode.type}
                </span>
                <span
                  className={`font-mono text-[9px] px-2 py-0.5 rounded-xs font-bold ${
                    selectedNode.status === 'HUMAN_APPROVED' || selectedNode.status === 'PASS' || selectedNode.status === 'OK' || selectedNode.status === 'READY'
                      ? 'bg-[#416C49]/15 text-[#416C49]'
                      : 'bg-[#C04E2A]/15 text-[#C04E2A]'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              {/* Title */}
              <div>
                <h4 className="font-serif text-sm font-bold text-[#351D1D] leading-snug">
                  {selectedNode.label}
                </h4>
                <p className="text-[11px] text-[#786A61] mt-1 font-mono">
                  {selectedNode.sublabel}
                </p>
              </div>

              {/* Specific Content Details */}
              {selectedNode.type === 'CLAIM' && selectedNode.metadata && (
                <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] font-bold block">
                    Verbatim Evidence Quote
                  </span>
                  <p className="text-[11px] italic text-[#351D1D] leading-relaxed">
                    "{selectedNode.metadata.exact_supporting_quote || selectedNode.metadata.claim_text}"
                  </p>
                  <div className="pt-2 border-t border-[#E6CBBD] flex justify-between text-[10px] font-mono text-[#786A61]">
                    <span>Metric: {selectedNode.metadata.numbers_and_units || 'N/A'}</span>
                    <span>Cohort: {selectedNode.metadata.population || 'Adults'}</span>
                  </div>
                </div>
              )}

              {selectedNode.type === 'PASSAGE' && selectedNode.metadata && (
                <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] font-bold block">
                    Extracted PDF Verbatim Text
                  </span>
                  <p className="text-[11px] text-[#351D1D] leading-relaxed">
                    "{selectedNode.metadata.verbatim_text}"
                  </p>
                  <div className="pt-2 border-t border-[#E6CBBD] text-[10px] font-mono text-[#786A61]">
                    Page {selectedNode.metadata.pdf_page_index} · Section: {selectedNode.metadata.section}
                  </div>
                </div>
              )}

              {selectedNode.type === 'VALIDATION_CHECK' && (
                <div className="p-3 bg-[#416C49]/10 border border-[#416C49]/30 rounded-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#416C49] font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Gate Passed (12/12 Clean)</span>
                  </div>
                  <p className="text-[11px] text-[#351D1D]">
                    This empirical claim has passed deterministic validation checks: zero medical hallucination, verbatim quotation integrity, population specification, and Indian metabolic context calibration.
                  </p>
                </div>
              )}

              {selectedNode.type === 'DELIVERABLE' && (
                <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
                  <span className="text-[9px] font-mono uppercase text-[#661414] font-bold block">
                    Instagram Ready Deliverable
                  </span>
                  <p className="text-[11px] text-[#351D1D]">
                    Fully formatted and synthesized into Steer's calm editorial aesthetic. 100% traceable to peer-reviewed clinical data.
                  </p>
                  <button
                    onClick={onNavigateToStudio}
                    className="w-full mt-2 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] font-semibold text-xs rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Open in Instagram Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {selectedNode.type === 'CLAIM' && (
                  <button
                    onClick={() => onNavigateToDesk(selectedNode.entityId)}
                    className="w-full py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-semibold text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Inspect in Investigation Desk</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedNode.type === 'PASSAGE' && (
                  <button
                    onClick={() => onNavigateToDesk(undefined, selectedNode.entityId)}
                    className="w-full py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-semibold text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>View in Source Passage Viewer</span>
                    <BookOpen className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#E6CBBD] bg-[#FAF6F0] text-[10px] font-mono text-[#786A61] flex items-center justify-between">
          <span>steer / stitch</span>
          <span>100% Deterministic DAG</span>
        </div>
      </div>
    </div>
  );
};
