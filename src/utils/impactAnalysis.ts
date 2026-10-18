import {
  CarouselContent,
  CarouselSlide,
  ClaimRecord,
  ClaimReviewStatus,
  DownstreamImpactItem,
  ChangeImpactAnalysisResult,
  ReelContent,
  ReelScene,
  StaticPostContent,
} from '../types';

/**
 * Analyzes downstream content deliverables that depend on a given claim.
 * Traces exact relationships stored in deliverable.mapped_claim_ids and deliverable.approved_claim_ids.
 */
export function analyzeClaimImpact(
  claimId: string,
  newStatus: ClaimReviewStatus,
  deliverables: {
    carousels: CarouselContent[];
    staticPosts: StaticPostContent[];
    reels: ReelContent[];
  },
  previousClaimText?: string,
  newClaimText?: string
): ChangeImpactAnalysisResult {
  const affected: DownstreamImpactItem[] = [];
  const textChanged =
    previousClaimText && newClaimText && previousClaimText.trim() !== newClaimText.trim();
  const isStatusCritical = newStatus === 'BLOCKED' || newStatus === 'REJECTED';
  const isStatusFlagged = newStatus === 'FLAGGED';

  // 1. Inspect Carousels
  deliverables.carousels.forEach((carousel) => {
    carousel.slides.forEach((slide) => {
      if (slide.mapped_claim_ids && slide.mapped_claim_ids.includes(claimId)) {
        let reason = '';
        let severity: DownstreamImpactItem['severity'] = 'MEDIUM_WARNING';

        if (isStatusCritical) {
          severity = 'HIGH_BLOCKER';
          reason = `Upstream Claim ${claimId} was ${newStatus}. Public presentation of this slide is blocked until claim is restored or re-mapped.`;
        } else if (isStatusFlagged) {
          severity = 'MEDIUM_WARNING';
          reason = `Upstream Claim ${claimId} was FLAGGED. Slide copy must be checked for qualification and alignment.`;
        } else if (textChanged) {
          severity = 'MEDIUM_WARNING';
          reason = `Claim text was edited. Review slide copy to ensure it reflects the amended statement.`;
        }

        if (reason) {
          affected.push({
            deliverable_type: 'CAROUSEL',
            deliverable_id: carousel.id,
            item_label: `Carousel "${carousel.title || 'Deck'}" · Slide ${slide.slide_number}: ${slide.headline.substring(0, 36)}...`,
            slide_or_scene_number: slide.slide_number,
            current_copy: `${slide.headline} — ${slide.body_text}`,
            severity,
            reason,
          });
        }
      }
    });
  });

  // 2. Inspect Static Posts
  deliverables.staticPosts.forEach((post) => {
    if (post.approved_claim_ids && post.approved_claim_ids.includes(claimId)) {
      let reason = '';
      let severity: DownstreamImpactItem['severity'] = 'MEDIUM_WARNING';

      if (isStatusCritical) {
        severity = 'HIGH_BLOCKER';
        reason = `Upstream Claim ${claimId} was ${newStatus}. Static square graphic relies on this claim and cannot be published.`;
      } else if (isStatusFlagged) {
        severity = 'MEDIUM_WARNING';
        reason = `Upstream Claim ${claimId} was FLAGGED. Verify that post qualification accounts for this flag.`;
      } else if (textChanged) {
        severity = 'MEDIUM_WARNING';
        reason = `Underlying claim text was amended. Re-audit static post headline and finding copy.`;
      }

      if (reason) {
        affected.push({
          deliverable_type: 'STATIC',
          deliverable_id: post.id,
          item_label: `Static Graphic 1080×1080: "${post.headline.substring(0, 36)}..."`,
          current_copy: `${post.headline} — ${post.primary_finding}`,
          severity,
          reason,
        });
      }
    }
  });

  // 3. Inspect Reels
  deliverables.reels.forEach((reel) => {
    reel.scenes.forEach((scene) => {
      if (scene.mapped_claim_ids && scene.mapped_claim_ids.includes(claimId)) {
        let reason = '';
        let severity: DownstreamImpactItem['severity'] = 'MEDIUM_WARNING';

        if (isStatusCritical) {
          severity = 'HIGH_BLOCKER';
          reason = `Upstream Claim ${claimId} was ${newStatus}. Vertical Reel Scene ${scene.scene_number} voiceover script depends on this invalidated finding.`;
        } else if (isStatusFlagged) {
          severity = 'MEDIUM_WARNING';
          reason = `Upstream Claim ${claimId} was FLAGGED. Check voiceover script tone and caveats.`;
        } else if (textChanged) {
          severity = 'MEDIUM_WARNING';
          reason = `Claim statement modified. Verify on-screen text and voiceover phrasing.`;
        }

        if (reason) {
          affected.push({
            deliverable_type: 'REEL',
            deliverable_id: reel.id,
            item_label: `Vertical Reel "${reel.title || 'Reel'}" · Scene ${scene.scene_number} (${scene.duration_sec}s)`,
            slide_or_scene_number: scene.scene_number,
            current_copy: `"${scene.voiceover_script}" [On-screen: ${scene.on_screen_text}]`,
            severity,
            reason,
          });
        }
      }
    });
  });

  const hasImpact = affected.length > 0;
  const summary = hasImpact
    ? `Change to Claim ${claimId} impacts ${affected.length} downstream deliverable item(s) (${affected.filter((a) => a.severity === 'HIGH_BLOCKER').length} critical blocker(s)).`
    : `No downstream deliverables currently depend on Claim ${claimId}.`;

  return {
    has_impact: hasImpact,
    triggering_claim_id: claimId,
    current_status: newStatus,
    affected_items_count: affected.length,
    affected_deliverables: affected,
    summary,
  };
}

/**
 * Propagates invalidation flags to downstream deliverables in response to claim modifications.
 * Does NOT delete user content or fabricate replacements.
 */
export function propagateClaimChange(
  claim: ClaimRecord,
  previousClaim: ClaimRecord | undefined,
  deliverables: {
    carousels: CarouselContent[];
    staticPosts: StaticPostContent[];
    reels: ReelContent[];
  }
): {
  updatedCarousels: CarouselContent[];
  updatedStaticPosts: StaticPostContent[];
  updatedReels: ReelContent[];
  impactReport: ChangeImpactAnalysisResult;
} {
  const previousText = previousClaim?.claim_text;
  const isRejectedOrBlocked =
    claim.review_status === 'BLOCKED' || claim.review_status === 'REJECTED';
  const isFlagged = claim.review_status === 'FLAGGED';
  const textEdited = previousText && previousText.trim() !== claim.claim_text.trim();

  const impactReport = analyzeClaimImpact(
    claim.claim_id,
    claim.review_status,
    deliverables,
    previousText,
    claim.claim_text
  );

  const shouldInvalidate = isRejectedOrBlocked || isFlagged || textEdited;

  const updatedCarousels: CarouselContent[] = deliverables.carousels.map((carousel) => {
    let carouselAffected = false;
    const updatedSlides: CarouselSlide[] = carousel.slides.map((slide) => {
      if (slide.mapped_claim_ids && slide.mapped_claim_ids.includes(claim.claim_id)) {
        if (shouldInvalidate) {
          carouselAffected = true;
          return {
            ...slide,
            invalidation_flag: {
              claim_id: claim.claim_id,
              reason: isRejectedOrBlocked
                ? `Claim ${claim.claim_id} changed to ${claim.review_status}.`
                : isFlagged
                ? `Claim ${claim.claim_id} has been FLAGGED by reviewer.`
                : `Claim text modified. Review slide copy against updated statement.`,
              claim_status: claim.review_status,
            },
          };
        } else if (claim.review_status === 'HUMAN_APPROVED') {
          // Clear flag if claim was verified
          const { invalidation_flag, ...rest } = slide;
          return rest;
        }
      }
      return slide;
    });

    if (carouselAffected) {
      return {
        ...carousel,
        slides: updatedSlides,
        status: (isRejectedOrBlocked
          ? 'INVALIDATED_BY_CLAIM_EDIT'
          : 'NEEDS_REREVIEW') as CarouselContent['status'],
        invalidation_details: {
          invalidated_at: new Date().toISOString(),
          triggered_by_claim_id: claim.claim_id,
          reason: impactReport.summary,
          affected_items: updatedSlides
            .filter((s) => s.invalidation_flag)
            .map((s) => `Slide ${s.slide_number}`),
        },
      };
    }
    return { ...carousel, slides: updatedSlides };
  });

  const updatedStaticPosts: StaticPostContent[] = deliverables.staticPosts.map((post) => {
    if (post.approved_claim_ids && post.approved_claim_ids.includes(claim.claim_id)) {
      if (shouldInvalidate) {
        return {
          ...post,
          status: (isRejectedOrBlocked
            ? 'INVALIDATED_BY_CLAIM_EDIT'
            : 'NEEDS_REREVIEW') as StaticPostContent['status'],
          invalidation_details: {
            invalidated_at: new Date().toISOString(),
            triggered_by_claim_id: claim.claim_id,
            reason: impactReport.summary,
            affected_items: ['Headline & Primary Finding'],
          },
        };
      }
    }
    return post;
  });

  const updatedReels: ReelContent[] = deliverables.reels.map((reel) => {
    let reelAffected = false;
    const updatedScenes: ReelScene[] = reel.scenes.map((scene) => {
      if (scene.mapped_claim_ids && scene.mapped_claim_ids.includes(claim.claim_id)) {
        if (shouldInvalidate) {
          reelAffected = true;
          return {
            ...scene,
            invalidation_flag: {
              claim_id: claim.claim_id,
              reason: isRejectedOrBlocked
                ? `Claim ${claim.claim_id} changed to ${claim.review_status}.`
                : isFlagged
                ? `Claim ${claim.claim_id} was FLAGGED.`
                : `Claim statement modified.`,
              claim_status: claim.review_status,
            },
          };
        } else if (claim.review_status === 'HUMAN_APPROVED') {
          const { invalidation_flag, ...rest } = scene;
          return rest;
        }
      }
      return scene;
    });

    if (reelAffected) {
      return {
        ...reel,
        scenes: updatedScenes,
        status: (isRejectedOrBlocked
          ? 'INVALIDATED_BY_CLAIM_EDIT'
          : 'NEEDS_REREVIEW') as ReelContent['status'],
        invalidation_details: {
          invalidated_at: new Date().toISOString(),
          triggered_by_claim_id: claim.claim_id,
          reason: impactReport.summary,
          affected_items: updatedScenes
            .filter((s) => s.invalidation_flag)
            .map((s) => `Scene ${s.scene_number}`),
        },
      };
    }
    return { ...reel, scenes: updatedScenes };
  });

  return {
    updatedCarousels,
    updatedStaticPosts,
    updatedReels,
    impactReport,
  };
}
