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
  Layers,
  ArrowRight,
  Filter,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  FileText,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Video,
  ListFilter,
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
  // Graph controls
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusClaimId, setFocusClaimId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');

  // Filter toggles
  const [visibleTypes, setVisibleTypes] = useState<Record<ProvenanceNodeType, boolean>>({
    DOCUMENT: true,
    PASSAGE: true,
    CLAIM: true,
    VALIDATION_CHECK: true,
    DELIVERABLE: true,
  });

  const [statusFilter, setStatusFilter] = useState<'ALL' | ClaimReviewStatus>('ALL');

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

  // Construct true graph nodes and edges strictly from the underlying records
  const { nodes, edges } = useMemo(() => {
    const rawNodes: ProvenanceNode[] = [];
    const rawEdges: ProvenanceEdge[] = [];

    // 1. Document Node
    rawNodes.push({
      id: `node_doc_${activePaper.paper_id}`,
      type: 'DOCUMENT',
      label: activePaper.title.substring(0, 48) + '...',
      sublabel: `${activePaper.journal || 'Journal'} (${activePaper.year})`,
      status: activePaper.is_metadata_verified ? 'Verified Metadata' : 'Unverified Metadata',
      entityId: activePaper.paper_id,
      metadata: activePaper,
    });

    // 2. Passage Nodes & CONTAINS edges
    paperPassages.forEach((p) => {
      const pNodeId = `node_pass_${p.evidence_id}`;
      rawNodes.push({
        id: pNodeId,
        type: 'PASSAGE',
        label: `Passage p. ${p.pdf_page_index} (${p.section})`,
        sublabel: p.verbatim_text.substring(0, 50) + '...',
        status: p.extraction_status,
        entityId: p.evidence_id,
        metadata: p,
      });

      rawEdges.push({
        id: `edge_doc_to_${p.evidence_id}`,
        source: `node_doc_${activePaper.paper_id}`,
        target: pNodeId,
        type: 'CONTAINS',
        label: 'contains',
      });
    });

    // 3. Claim Nodes & SUPPORTS / CONTRADICTS edges
    paperClaims.forEach((c) => {
      const cNodeId = `node_claim_${c.claim_id}`;
      rawNodes.push({
        id: cNodeId,
        type: 'CLAIM',
        label: c.claim_text.substring(0, 52) + '...',
        sublabel: `${c.population} · ${c.study_design}`,
        status: c.review_status,
        entityId: c.claim_id,
        metadata: c,
      });

      // Supporting passages
      c.evidence_ids.forEach((evId) => {
        const passageExists = paperPassages.some((p) => p.evidence_id === evId);
        if (passageExists) {
          rawEdges.push({
            id: `edge_supp_${evId}_${c.claim_id}`,
            source: `node_pass_${evId}`,
            target: cNodeId,
            type: 'SUPPORTS',
            label: 'supports',
          });
        }
      });

      // Contradicting passages if any
      if (c.contradicting_passage_ids) {
        c.contradicting_passage_ids.forEach((evId) => {
          if (paperPassages.some((p) => p.evidence_id === evId)) {
            rawEdges.push({
              id: `edge_contra_${evId}_${c.claim_id}`,
              source: `node_pass_${evId}`,
              target: cNodeId,
              type: 'CONTRADICTS',
              label: 'contradicts',
              severity: 'contradiction',
            });
          }
        });
      }

      // 4. Validation Checks evaluating this claim
      if (c.validation_checks && c.validation_checks.length > 0) {
        // Group checks or show failed/flagged rules
        c.validation_checks.forEach((chk) => {
          if (chk.outcome !== 'PASS') {
            const chkNodeId = `node_chk_${c.claim_id}_${chk.rule_id}`;
            rawNodes.push({
              id: chkNodeId,
              type: 'VALIDATION_CHECK',
              label: `${chk.rule_name} (Rule ${chk.rule_number})`,
              sublabel: chk.reason.substring(0, 48) + '...',
              status: chk.outcome,
              entityId: chk.rule_id,
              metadata: chk,
            });

            rawEdges.push({
              id: `edge_eval_${chk.rule_id}_${c.claim_id}`,
              source: chkNodeId,
              target: cNodeId,
              type: 'EVALUATES',
              label: chk.outcome === 'FAIL' ? 'fails' : 'evaluates',
              severity: chk.outcome === 'FAIL' ? 'invalidated' : 'normal',
            });
          }
        });
      }
    });

    // 5. Content Deliverable Nodes & DEPENDS_ON edges
    if (carousel) {
      carousel.slides.forEach((slide) => {
        const slideNodeId = `node_slide_${carousel.id}_${slide.slide_number}`;
        rawNodes.push({
          id: slideNodeId,
          type: 'DELIVERABLE',
          label: `Slide ${slide.slide_number}: ${slide.headline.substring(0, 36)}...`,
          sublabel: `Carousel Deck · ${slide.layout}`,
          status: slide.invalidation_flag ? 'NEEDS_REREVIEW' : carousel.status,
          entityId: `${carousel.id}_slide_${slide.slide_number}`,
          metadata: { ...slide, deliverableType: 'CAROUSEL', parentId: carousel.id },
        });

        slide.mapped_claim_ids.forEach((cid) => {
          if (paperClaims.some((c) => c.claim_id === cid)) {
            rawEdges.push({
              id: `edge_dep_slide_${slide.slide_number}_${cid}`,
              source: `node_claim_${cid}`,
              target: slideNodeId,
              type: 'DEPENDS_ON',
              label: 'informs',
              severity: slide.invalidation_flag ? 'invalidated' : 'normal',
            });
          }
        });
      });
    }

    if (staticPost) {
      const staticNodeId = `node_static_${staticPost.id}`;
      rawNodes.push({
        id: staticNodeId,
        type: 'DELIVERABLE',
        label: `Static Post: ${staticPost.headline.substring(0, 36)}...`,
        sublabel: '1080×1080 Square Graphic',
        status: staticPost.status,
        entityId: staticPost.id,
        metadata: { ...staticPost, deliverableType: 'STATIC' },
      });

      staticPost.approved_claim_ids.forEach((cid) => {
        if (paperClaims.some((c) => c.claim_id === cid)) {
          rawEdges.push({
            id: `edge_dep_static_${cid}`,
            source: `node_claim_${cid}`,
            target: staticNodeId,
            type: 'DEPENDS_ON',
            label: 'informs',
          });
        }
      });
    }

    if (reel) {
      reel.scenes.forEach((scene) => {
        const sceneNodeId = `node_reel_${reel.id}_${scene.scene_number}`;
        rawNodes.push({
          id: sceneNodeId,
          type: 'DELIVERABLE',
          label: `Reel Scene ${scene.scene_number}: ${scene.title.substring(0, 30)}`,
          sublabel: `9:16 Vertical Reel · ${scene.duration_sec}s`,
          status: scene.invalidation_flag ? 'NEEDS_REREVIEW' : reel.status,
          entityId: `${reel.id}_scene_${scene.scene_number}`,
          metadata: { ...scene, deliverableType: 'REEL', parentId: reel.id },
        });

        scene.mapped_claim_ids.forEach((cid) => {
          if (paperClaims.some((c) => c.claim_id === cid)) {
            rawEdges.push({
              id: `edge_dep_reel_${scene.scene_number}_${cid}`,
              source: `node_claim_${cid}`,
              target: sceneNodeId,
              type: 'DEPENDS_ON',
              label: 'informs',
              severity: scene.invalidation_flag ? 'invalidated' : 'normal',
            });
          }
        });
      });
    }

    // Apply Filter & Neighborhood isolation
    let filteredNodes = rawNodes.filter((n) => visibleTypes[n.type]);
    if (statusFilter !== 'ALL') {
      filteredNodes = filteredNodes.filter((n) => {
        if (n.type === 'CLAIM') return n.status === statusFilter;
        return true;
      });
    }

    if (focusClaimId !== 'ALL') {
      const targetClaimNodeId = `node_claim_${focusClaimId}`;
      const directConnectedEdgeSources = rawEdges
        .filter((e) => e.target === targetClaimNodeId)
        .map((e) => e.source);
      const directConnectedEdgeTargets = rawEdges
        .filter((e) => e.source === targetClaimNodeId)
        .map((e) => e.target);

      const neighborhoodIds = new Set([
        targetClaimNodeId,
        ...directConnectedEdgeSources,
        ...directConnectedEdgeTargets,
      ]);

      filteredNodes = filteredNodes.filter((n) => neighborhoodIds.has(n.id));
    }

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = rawEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    // Compute coordinate positions by column layer
    const columnOrder: ProvenanceNodeType[] = [
      'DOCUMENT',
      'PASSAGE',
      'CLAIM',
      'VALIDATION_CHECK',
      'DELIVERABLE',
    ];

    const columnXCoords = {
      DOCUMENT: 40,
      PASSAGE: 260,
      CLAIM: 560,
      VALIDATION_CHECK: 860,
      DELIVERABLE: 1140,
    };

    const typeBuckets: Record<ProvenanceNodeType, ProvenanceNode[]> = {
      DOCUMENT: [],
      PASSAGE: [],
      CLAIM: [],
      VALIDATION_CHECK: [],
      DELIVERABLE: [],
    };

    filteredNodes.forEach((n) => {
      typeBuckets[n.type].push(n);
    });

    // Assign X and Y coordinates
    filteredNodes.forEach((n) => {
      const bucket = typeBuckets[n.type];
      const indexInBucket = bucket.indexOf(n);
      n.x = columnXCoords[n.type];
      n.y = 80 + indexInBucket * 90;
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [
    activePaper,
    paperPassages,
    paperClaims,
    carousel,
    staticPost,
    reel,
    visibleTypes,
    statusFilter,
    focusClaimId,
  ]);

  // Connected nodes identification for highlighting
  const activeFocusId = selectedNodeId || hoveredNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const ids = new Set<string>([activeFocusId]);

    edges.forEach((edge) => {
      if (edge.source === activeFocusId) ids.add(edge.target);
      if (edge.target === activeFocusId) ids.add(edge.source);
    });

    return ids;
  }, [activeFocusId, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
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

  const maxCanvasHeight = Math.max(
    650,
    ...nodes.map((n) => (n.y || 0) + 120)
  );

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-5">
      {/* 01. Desk Header & Toolbar */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#391E1D]">
            Claim Provenance & Dependency Graph
          </h2>
          <p className="text-xs text-[#786A61]">
            Interactive topological DAG tracing source documents, verbatim passages, empirical claims, validation checks, and public deliverables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Claim Focus Isolation Selector */}
          <div className="flex items-center gap-1.5 bg-[#F5EFE6] px-2.5 py-1 border border-[#DED2C5] rounded-xs font-mono text-[11px]">
            <span className="text-[#786A61]">Focus Subtree:</span>
            <select
              value={focusClaimId}
              onChange={(e) => setFocusClaimId(e.target.value)}
              className="bg-[#FFFDF9] border border-[#DED2C5] text-[#391E1D] text-xs py-0.5 px-2 rounded-xs focus:outline-none focus:border-[#74191D]"
            >
              <option value="ALL">All Network Elements</option>
              {paperClaims.map((c, i) => (
                <option key={c.claim_id} value={c.claim_id}>
                  Claim #{i + 1}: {c.claim_text.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#DED2C5] bg-[#F5EFE6] p-0.5 rounded-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-[#FFFDF9] text-[#74191D] font-semibold shadow-xs'
                  : 'text-[#786A61] hover:text-[#391E1D]'
              }`}
            >
              Graph Canvas
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-[#FFFDF9] text-[#74191D] font-semibold shadow-xs'
                  : 'text-[#786A61] hover:text-[#391E1D]'
              }`}
            >
              Traceability Matrix
            </button>
          </div>
        </div>
      </div>

      {/* 02. Filter & Legend Strip */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
            LAYERS:
          </span>

          {(
            [
              ['DOCUMENT', 'Source Paper', '#786A61'],
              ['PASSAGE', 'Extracted Passages', '#BB4B2D'],
              ['CLAIM', 'Claims', '#74191D'],
              ['VALIDATION_CHECK', 'Validation Checks', '#C25E00'],
              ['DELIVERABLE', 'Deliverables', '#416C49'],
            ] as const
          ).map(([type, label, color]) => (
            <label
              key={type}
              className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-[#391E1D]"
            >
              <input
                type="checkbox"
                checked={visibleTypes[type]}
                onChange={() =>
                  setVisibleTypes((prev) => ({ ...prev, [type]: !prev[type] }))
                }
                className="rounded-xs text-[#74191D] accent-[#74191D] cursor-pointer"
              />
              <span
                className="w-2 h-2 rounded-xs"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {/* Zoom & Canvas Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            className="p-1 border border-[#DED2C5] hover:bg-[#F5EFE6] rounded-xs cursor-pointer text-[#786A61]"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-[#786A61] px-1 tabular-nums">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-1 border border-[#DED2C5] hover:bg-[#F5EFE6] rounded-xs cursor-pointer text-[#786A61]"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1 border border-[#DED2C5] hover:bg-[#F5EFE6] rounded-xs cursor-pointer text-[#786A61]"
            title="Reset position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 03. Main Viewport: Canvas vs. Accessible Matrix */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Interactive SVG DAG (9 Cols) */}
          <div
            className="lg:col-span-9 bg-[#FFFDF9] border border-[#DED2C5] relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{ height: '680px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Column Headers Ribbon */}
            <div className="absolute top-0 inset-x-0 h-8 bg-[#F5EFE6]/80 border-b border-[#DED2C5] z-10 grid grid-cols-5 text-[9px] font-mono uppercase tracking-widest text-[#786A61] font-semibold px-4 items-center text-center">
              <div>1. Source Paper</div>
              <div>2. Passages</div>
              <div>3. Claims</div>
              <div>4. Validation</div>
              <div>5. Outputs</div>
            </div>

            <svg
              className="w-full h-full"
              viewBox={`0 0 1400 ${maxCanvasHeight}`}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
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
                <marker
                  id="arrow-highlighted"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#74191D" />
                </marker>
                <marker
                  id="arrow-contradiction"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#BB4B2D" />
                </marker>
              </defs>

              {/* Render Graph Edges */}
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isConnected =
                  activeFocusId &&
                  (edge.source === activeFocusId || edge.target === activeFocusId);
                const isDimmed = activeFocusId && !isConnected;

                const startX = (sourceNode.x || 0) + 210;
                const startY = (sourceNode.y || 0) + 32;
                const endX = (targetNode.x || 0);
                const endY = (targetNode.y || 0) + 32;

                const deltaX = endX - startX;
                const curveControlX1 = startX + deltaX * 0.45;
                const curveControlX2 = endX - deltaX * 0.45;

                const pathData = `M ${startX} ${startY} C ${curveControlX1} ${startY}, ${curveControlX2} ${endY}, ${endX} ${endY}`;

                let strokeColor = '#DED2C5';
                let markerId = 'arrow-normal';
                let strokeWidth = 1.5;

                if (edge.severity === 'contradiction') {
                  strokeColor = '#BB4B2D';
                  markerId = 'arrow-contradiction';
                  strokeWidth = 2;
                } else if (isConnected) {
                  strokeColor = '#74191D';
                  markerId = 'arrow-highlighted';
                  strokeWidth = 2.5;
                }

                return (
                  <g key={edge.id} opacity={isDimmed ? 0.15 : 1} className="transition-opacity duration-150">
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={edge.type === 'CONTRADICTS' ? '4 3' : 'none'}
                      markerEnd={`url(#${markerId})`}
                    />
                    {isConnected && (
                      <text
                        x={(startX + endX) / 2}
                        y={(startY + endY) / 2 - 5}
                        fill="#74191D"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="font-bold"
                      >
                        {edge.label || edge.type}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Render Graph Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isDimmed = activeFocusId && !isConnected;

                let headerBg = '#FFFDF9';
                let borderStroke = '#DED2C5';
                let typeColor = '#786A61';

                if (node.type === 'CLAIM') {
                  if (node.status === 'HUMAN_APPROVED') {
                    borderStroke = '#416C49';
                    typeColor = '#416C49';
                  } else if (node.status === 'FLAGGED') {
                    borderStroke = '#BB4B2D';
                    typeColor = '#BB4B2D';
                  } else if (node.status === 'BLOCKED') {
                    borderStroke = '#74191D';
                    typeColor = '#74191D';
                  }
                } else if (node.type === 'DELIVERABLE') {
                  borderStroke = '#DED2C5';
                  typeColor = '#416C49';
                }

                if (isSelected) {
                  borderStroke = '#74191D';
                }

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
                    opacity={isDimmed ? 0.2 : 1}
                    className="cursor-pointer transition-opacity duration-150"
                  >
                    {/* Node Card Shell */}
                    <rect
                      x="0"
                      y="0"
                      width="210"
                      height="64"
                      rx="2"
                      fill={isSelected ? '#F7E9DE' : headerBg}
                      stroke={isSelected ? '#74191D' : borderStroke}
                      strokeWidth={isSelected ? 2 : 1}
                      filter="drop-shadow(0 1px 1px rgba(0,0,0,0.05))"
                    />

                    {/* Node Type Top Tag */}
                    <text
                      x="10"
                      y="16"
                      fill={typeColor}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="600"
                      letterSpacing="0.05em"
                    >
                      {node.type}
                    </text>

                    {/* Status Pill on top right */}
                    {node.status && (
                      <text
                        x="200"
                        y="16"
                        fill={typeColor}
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="end"
                        fontWeight="600"
                      >
                        {node.status.replace(/_/g, ' ')}
                      </text>
                    )}

                    {/* Primary Label */}
                    <text
                      x="10"
                      y="34"
                      fill="#391E1D"
                      fontSize="11"
                      fontFamily="serif"
                      fontWeight="600"
                      className="truncate"
                    >
                      {node.label}
                    </text>

                    {/* Sublabel */}
                    {node.sublabel && (
                      <text
                        x="10"
                        y="50"
                        fill="#786A61"
                        fontSize="9.5"
                        fontFamily="sans-serif"
                      >
                        {node.sublabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right: Selected Node Provenance Inspector (3 Cols) */}
          <div className="lg:col-span-3 bg-[#FFFDF9] border border-[#DED2C5] p-5 space-y-4">
            <div className="border-b border-[#DED2C5] pb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                NODE PROVENANCE
              </span>
              {selectedNode && (
                <span className="text-[10px] font-mono text-[#74191D] font-bold">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-mono text-[9px] uppercase text-[#786A61] block font-semibold mb-1">
                    Node Title / Statement
                  </span>
                  <p className="font-serif font-bold text-sm text-[#391E1D] leading-snug">
                    {selectedNode.label}
                  </p>
                  {selectedNode.sublabel && (
                    <p className="text-[11px] text-[#786A61] mt-1 font-mono">
                      {selectedNode.sublabel}
                    </p>
                  )}
                </div>

                {selectedNode.type === 'CLAIM' && (
                  <div className="space-y-2 border-t border-[#DED2C5] pt-3">
                    <span className="font-mono text-[9px] uppercase text-[#786A61] block font-semibold">
                      Connected Provenance
                    </span>
                    <div className="p-2.5 bg-[#F5EFE6]/60 border border-[#DED2C5] space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#786A61]">Review Status:</span>
                        <span className="font-semibold text-[#391E1D]">
                          {selectedNode.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786A61]">Direct Passages:</span>
                        <span className="font-mono text-[#74191D]">
                          {
                            edges.filter(
                              (e) => e.target === selectedNode.id && e.type === 'SUPPORTS'
                            ).length
                          } linked
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786A61]">Downstream Outputs:</span>
                        <span className="font-mono text-[#416C49]">
                          {
                            edges.filter(
                              (e) => e.source === selectedNode.id && e.type === 'DEPENDS_ON'
                            ).length
                          } outputs
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToDesk(selectedNode.entityId)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Inspect in Investigation Desk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedNode.type === 'PASSAGE' && (
                  <div className="space-y-2 border-t border-[#DED2C5] pt-3">
                    <span className="font-mono text-[9px] uppercase text-[#786A61] block font-semibold">
                      Verbatim Passage Excerpt
                    </span>
                    <div className="p-3 bg-[#F7E9DE]/70 border border-[#DED2C5] font-serif text-xs italic leading-relaxed text-[#391E1D]">
                      "{selectedNode.metadata?.verbatim_text || selectedNode.sublabel}"
                    </div>
                    <button
                      onClick={() => onNavigateToDesk(undefined, selectedNode.entityId)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>View in Galley Reader</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedNode.type === 'DELIVERABLE' && (
                  <div className="space-y-2 border-t border-[#DED2C5] pt-3">
                    <span className="font-mono text-[9px] uppercase text-[#786A61] block font-semibold">
                      Derived Content Output
                    </span>
                    <p className="text-[11px] text-[#391E1D] leading-relaxed">
                      {selectedNode.metadata?.body_text ||
                        selectedNode.metadata?.voiceover_script ||
                        selectedNode.metadata?.supporting_text ||
                        'Verified educational social deliverable.'}
                    </p>
                    <button
                      onClick={onNavigateToStudio}
                      className="w-full py-2 px-3 text-xs font-semibold bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Open in Content Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-[#786A61] text-xs">
                Select any node in the graph to inspect exact provenance and downstream dependencies.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 04. Accessible Traceability Matrix Alternative */
        <div className="bg-[#FFFDF9] border border-[#DED2C5] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5EFE6] border-b border-[#DED2C5] text-[10px] font-mono uppercase text-[#786A61]">
                <th className="p-3">Claim Statement</th>
                <th className="p-3">Review Status</th>
                <th className="p-3">Supporting Source Evidence</th>
                <th className="p-3">Validation Outcome</th>
                <th className="p-3">Downstream Deliverable Dependencies</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED2C5]">
              {paperClaims.map((claim) => {
                const linkedP = paperPassages.filter((p) =>
                  claim.evidence_ids.includes(p.evidence_id)
                );
                const dependentSlides = carousel?.slides.filter((s) =>
                  s.mapped_claim_ids.includes(claim.claim_id)
                );
                const dependentReelScenes = reel?.scenes.filter((s) =>
                  s.mapped_claim_ids.includes(claim.claim_id)
                );

                return (
                  <tr key={claim.claim_id} className="hover:bg-[#F5EFE6]/30 transition-colors">
                    <td className="p-3 max-w-[280px]">
                      <div className="font-serif font-semibold text-[#391E1D] leading-snug">
                        {claim.claim_text}
                      </div>
                      <div className="text-[10px] font-mono text-[#786A61] mt-0.5">
                        ID: {claim.claim_id}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-xs font-semibold ${
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
                    </td>

                    <td className="p-3 max-w-[260px]">
                      {linkedP.map((lp) => (
                        <div key={lp.evidence_id} className="text-[11px] space-y-0.5 mb-1.5">
                          <span className="font-mono text-[10px] text-[#74191D] font-semibold">
                            p. {lp.pdf_page_index} ({lp.section}):
                          </span>
                          <p className="font-serif italic text-[#391E1D] line-clamp-2">
                            "{lp.verbatim_text}"
                          </p>
                        </div>
                      ))}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {claim.validation_findings && claim.validation_findings.length > 0 ? (
                        <span className="text-[#BB4B2D] font-mono text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {claim.validation_findings.length} findings
                        </span>
                      ) : (
                        <span className="text-[#416C49] font-mono text-[10px] flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Verified Clean
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-[11px] font-mono">
                      <div className="space-y-0.5">
                        {dependentSlides && dependentSlides.length > 0 && (
                          <div className="text-[#391E1D]">
                            Carousel: Slide {dependentSlides.map((s) => s.slide_number).join(', ')}
                          </div>
                        )}
                        {dependentReelScenes && dependentReelScenes.length > 0 && (
                          <div className="text-[#391E1D]">
                            Reel: Scene {dependentReelScenes.map((s) => s.scene_number).join(', ')}
                          </div>
                        )}
                        {(!dependentSlides || dependentSlides.length === 0) &&
                          (!dependentReelScenes || dependentReelScenes.length === 0) && (
                            <span className="text-[#786A61]">No public outputs yet</span>
                          )}
                      </div>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigateToDesk(claim.claim_id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#74191D] hover:bg-[#74191D] hover:text-[#FFFDF9] border border-[#74191D]/30 rounded-xs transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
