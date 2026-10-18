import React, { useState, useEffect, useRef } from 'react';
import {
  CarouselContent,
  CarouselSlide,
  ClaimRecord,
  PaperRecord,
  ReelContent,
  ReelScene,
  StaticPostContent,
} from '../types';
import {
  downloadCarouselSlidePng,
  downloadJsonFile,
  downloadStaticPostPng,
  recordReelVideo,
} from '../utils/exportUtils';
import {
  Layers,
  FileText,
  Video,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Quote,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Volume2,
  VolumeX,
  Globe,
  Maximize2,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';

interface ContentStudioProps {
  activePaper: PaperRecord | null;
  approvedClaims: ClaimRecord[];
  allClaims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onUpdateCarousel: (carousel: CarouselContent) => void;
  onUpdateStaticPost: (post: StaticPostContent) => void;
  onUpdateReel: (reel: ReelContent) => void;
  onGenerateAllContent: () => Promise<void>;
  onNavigateToReview: () => void;
  onNavigateToDesk?: (claimId?: string) => void;
}

export const ContentStudio: React.FC<ContentStudioProps> = ({
  activePaper,
  approvedClaims,
  allClaims,
  carousel,
  staticPost,
  reel,
  onUpdateCarousel,
  onUpdateStaticPost,
  onUpdateReel,
  onGenerateAllContent,
  onNavigateToReview,
  onNavigateToDesk,
}) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'static' | 'reel' | 'caption'>('carousel');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatusText, setVideoStatusText] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCanvaCsv, setCopiedCanvaCsv] = useState(false);
  const [copiedCanvaTokens, setCopiedCanvaTokens] = useState(false);

  // Bonus: Language mode (English vs Hinglish)
  const [languageMode, setLanguageMode] = useState<'EN' | 'HINGLISH'>('EN');

  // Bonus: Aspect ratio preview for carousel (4:5 Feed vs 1:1 Square vs 9:16 Story)
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16'>('4:5');

  // Live Reel Player state
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [isVoiceoverAudioActive, setIsVoiceoverAudioActive] = useState(false);
  const [currentReelSceneIndex, setCurrentReelSceneIndex] = useState(0);
  const [reelElapsedSeconds, setReelElapsedSeconds] = useState(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reel playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlayingReel && reel && reel.scenes.length > 0) {
      interval = setInterval(() => {
        setReelElapsedSeconds((prev) => {
          const next = prev + 1;
          let accumulated = 0;
          let sceneIdx = 0;
          for (let i = 0; i < reel.scenes.length; i++) {
            accumulated += reel.scenes[i].duration_sec || 5;
            if (next <= accumulated) {
              sceneIdx = i;
              break;
            }
          }

          if (next >= reel.total_duration_sec) {
            setIsPlayingReel(false);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            setCurrentReelSceneIndex(0);
            return 0;
          }

          if (sceneIdx !== currentReelSceneIndex) {
            setCurrentReelSceneIndex(sceneIdx);
            if (isVoiceoverAudioActive && window.speechSynthesis) {
              playSpeechForScene(sceneIdx);
            }
          }

          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingReel, reel, currentReelSceneIndex, isVoiceoverAudioActive, languageMode]);

  const playSpeechForScene = (sceneIndex: number) => {
    if (!reel || !window.speechSynthesis) return;
    const scene = reel.scenes[sceneIndex];
    if (!scene) return;

    window.speechSynthesis.cancel();
    const textToSpeak =
      languageMode === 'HINGLISH' && scene.hinglish_voiceover
        ? scene.hinglish_voiceover
        : scene.voiceover_script;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleReelPlay = () => {
    if (isPlayingReel) {
      setIsPlayingReel(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else {
      setIsPlayingReel(true);
      if (isVoiceoverAudioActive) {
        playSpeechForScene(currentReelSceneIndex);
      }
    }
  };

  const handleToggleVoiceoverAudio = () => {
    const nextState = !isVoiceoverAudioActive;
    setIsVoiceoverAudioActive(nextState);
    if (!nextState && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else if (nextState && isPlayingReel) {
      playSpeechForScene(currentReelSceneIndex);
    }
  };

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#B58777]">
        Please ingest a scientific paper to access the Content Studio.
      </div>
    );
  }

  // Gate Check: No approved claims
  if (approvedClaims.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="border border-[#E6CBBD] bg-[#FFFDF9] p-8 sm:p-10 text-center space-y-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C04E2A] font-bold block">
            HUMAN REVIEW GATE ENFORCED
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#351D1D]">
            No Approved Claims in Ledger
          </h2>
          <p className="text-xs text-[#B58777] max-w-md mx-auto leading-relaxed">
            Content generation is restricted strictly to <strong>human-approved claims</strong>. Steer editorial policy prohibits publishing public health graphics from unverified drafts or blocked claims.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToReview}
              className="px-5 py-2.5 text-xs font-semibold text-[#F5EBDF] bg-[#661414] hover:bg-[#4a0d0d] rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Review & Approve Claims First</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide: CarouselSlide | undefined = carousel?.slides[currentSlideIndex];
  const isSlideInvalidated = !!currentSlide?.invalidation_flag;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerateAllContent();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcknowledgeSlideReverification = (index: number) => {
    if (!carousel) return;
    const updatedSlides = [...carousel.slides];
    delete updatedSlides[index].invalidation_flag;
    const hasRemainingInvalidations = updatedSlides.some((s) => !!s.invalidation_flag);
    onUpdateCarousel({
      ...carousel,
      slides: updatedSlides,
      status: hasRemainingInvalidations ? 'NEEDS_REREVIEW' : 'READY',
    });
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyCanvaCsv = () => {
    if (!carousel) return;
    const csvHeader = 'SlideNumber,Layout,ThemeVariant,Headline,BodyText,Finding,Caveat,Citation,FounderNote,Brand\n';
    const csvRows = carousel.slides
      .map((s) => {
        const headline = (languageMode === 'HINGLISH' && s.hinglish_headline ? s.hinglish_headline : s.headline).replace(/"/g, '""');
        const body = (languageMode === 'HINGLISH' && s.hinglish_body ? s.hinglish_body : s.body_text).replace(/"/g, '""');
        const finding = (s.finding || '').replace(/"/g, '""');
        const caveat = (s.caveat_or_limitation || '').replace(/"/g, '""');
        const citation = (s.source_citation || '').replace(/"/g, '""');
        const note = (s.founder_note || '').replace(/"/g, '""');
        return `"${s.slide_number}","${s.layout}","${s.theme_variant || 'cream'}","${headline}","${body}","${finding}","${caveat}","${citation}","${note}","steerclub.com"`;
      })
      .join('\n');

    navigator.clipboard.writeText(csvHeader + csvRows);
    setCopiedCanvaCsv(true);
    setTimeout(() => setCopiedCanvaCsv(false), 2500);
  };

  const handleCopyCanvaTokens = () => {
    const tokens = {
      brand: 'steer',
      website: 'steerclub.com',
      palette: {
        cream_base: '#F5EBDF',
        steer_rust: '#C04E2A',
        deep_maroon: '#661414',
        ink: '#351D1D',
        clay: '#B58777',
        blush: '#E6CBBD',
        soft_paper: '#F8F2EB',
      },
      typography: {
        headline: 'Fraunces Serif (Mix Upright & Italic)',
        body: 'Plus Jakarta Sans',
        notes: 'Caveat (Handwritten)',
      },
      paper: activePaper.title,
      total_slides: carousel?.slides.length || 0,
      slides: carousel?.slides || [],
    };

    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    setCopiedCanvaTokens(true);
    setTimeout(() => setCopiedCanvaTokens(false), 2500);
  };

  const handleDownloadAllSlidePngs = async () => {
    if (!carousel) return;
    for (let i = 0; i < carousel.slides.length; i++) {
      downloadCarouselSlidePng(carousel.slides[i], i, carousel.slides.length, activePaper.title);
      await new Promise((res) => setTimeout(res, 300));
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 01. Desk Header & Toolbar */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              steer / Content Production Studio
            </h2>
            <span className="text-[10px] font-mono text-[#416C49] bg-[#416C49]/10 px-2 py-0.5 rounded-xs font-semibold">
              Backed by {approvedClaims.length} Approved Claim{approvedClaims.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[#B58777]">
            Transforms scientific papers into scroll-stopping Instagram Carousels, Statics, and AI Reels in Steer's calm editorial voice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Mode Toggle (EN vs Hinglish) */}
          <button
            onClick={() => setLanguageMode((prev) => (prev === 'EN' ? 'HINGLISH' : 'EN'))}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
              languageMode === 'HINGLISH'
                ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                : 'bg-[#FFFDF9] text-[#351D1D] border-[#E6CBBD] hover:bg-[#F8F2EB]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{languageMode === 'HINGLISH' ? 'Hinglish Mode (Active)' : 'Language: English'}</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] disabled:opacity-50 text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>{isGenerating ? 'Synthesizing Steer Copy...' : 'Generate / Refresh Drafts'}</span>
          </button>
        </div>
      </div>

      {/* Global Invalidation Banner if present */}
      {(carousel?.status === 'INVALIDATED_BY_CLAIM_EDIT' ||
        carousel?.status === 'NEEDS_REREVIEW') && (
        <div className="p-3.5 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-xs text-[#C04E2A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Upstream Claim Modified:</strong> Deliverables have been flagged for re-review because an underlying claim was edited or flagged in the ledger.
            </span>
          </div>
          <button
            onClick={onNavigateToReview}
            className="px-2.5 py-1 bg-[#FFFDF9] border border-current text-[11px] font-semibold rounded-xs cursor-pointer whitespace-nowrap"
          >
            Audit Claim Ledger
          </button>
        </div>
      )}

      {/* 02. Format Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] text-xs font-mono gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('carousel')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'carousel'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Carousel Deck ({carousel?.slides.length || 0} Slides)</span>
          </button>

          <button
            onClick={() => setActiveTab('static')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'static'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single Static Post</span>
          </button>

          <button
            onClick={() => setActiveTab('reel')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'reel'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>9:16 Vertical Reel ({reel?.scenes.length || 0} Scenes)</span>
          </button>

          <button
            onClick={() => setActiveTab('caption')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'caption'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Captions & Hashtags</span>
          </button>
        </div>

        {/* Canva Automation quick buttons */}
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={handleCopyCanvaCsv}
            title="Copies CSV data ready to import into Canva Bulk Create"
            className="px-2.5 py-1 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[11px] font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCanvaCsv ? <Check className="w-3 h-3 text-[#416C49]" /> : <FileSpreadsheet className="w-3 h-3 text-[#C04E2A]" />}
            <span>{copiedCanvaCsv ? 'CSV Copied!' : 'Canva Bulk CSV'}</span>
          </button>

          <button
            onClick={handleCopyCanvaTokens}
            title="Copies Steer brand tokens & JSON for Canva automation"
            className="px-2.5 py-1 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[11px] font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCanvaTokens ? <Check className="w-3 h-3 text-[#416C49]" /> : <Copy className="w-3 h-3 text-[#C04E2A]" />}
            <span>{copiedCanvaTokens ? 'Tokens Copied!' : 'Canva JSON Tokens'}</span>
          </button>
        </div>
      </div>

      {/* 03. FORMAT 1: CAROUSEL WORKSPACE */}
      {activeTab === 'carousel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {carousel ? (
            <>
              {/* Left Column: Slide Gallery Preview (7 Cols) */}
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] pb-3 text-xs font-mono gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#661414]">
                      SLIDE {currentSlideIndex + 1} OF {carousel.slides.length}
                    </span>
                    <span>·</span>
                    <span className="uppercase text-[#B58777]">
                      Layout: {currentSlide?.layout}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Aspect Ratio Selector */}
                    <div className="flex items-center border border-[#E6CBBD] rounded-xs overflow-hidden text-[10px]">
                      {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-2 py-0.5 cursor-pointer font-mono ${
                            aspectRatio === ratio
                              ? 'bg-[#C04E2A] text-[#FFFDF9] font-bold'
                              : 'bg-[#FFFDF9] text-[#786A61] hover:bg-[#F8F2EB]'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentSlideIndex <= 0}
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1 border border-[#E6CBBD] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={currentSlideIndex >= carousel.slides.length - 1}
                        onClick={() =>
                          setCurrentSlideIndex((prev) =>
                            Math.min(carousel.slides.length - 1, prev + 1)
                          )
                        }
                        className="p-1 border border-[#E6CBBD] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invalidation Alert on Slide if applicable */}
                {isSlideInvalidated && (
                  <div className="p-3 bg-[#C04E2A]/10 border border-[#C04E2A]/40 text-xs text-[#C04E2A] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Upstream Claim Invalidation Detected on this Slide
                      </span>
                      <button
                        onClick={() => handleAcknowledgeSlideReverification(currentSlideIndex)}
                        className="px-2 py-0.5 bg-[#FFFDF9] border border-[#C04E2A] text-[10px] font-semibold rounded-xs cursor-pointer"
                      >
                        Acknowledge & Mark Verified
                      </button>
                    </div>
                    <p className="text-[11px] leading-snug">
                      {currentSlide?.invalidation_flag?.reason ||
                        'One or more mapped claims were modified, flagged, or rejected.'}
                    </p>
                  </div>
                )}

                {/* Rendered Slide Frame with Steer Palette */}
                {currentSlide && (
                  <div
                    className={`mx-auto border border-[#E6CBBD] p-7 sm:p-8 flex flex-col justify-between shadow-xs transition-all ${
                      aspectRatio === '4:5'
                        ? 'aspect-[4/5] max-w-[420px]'
                        : aspectRatio === '1:1'
                        ? 'aspect-square max-w-[420px]'
                        : 'aspect-[9/16] max-w-[320px]'
                    } ${
                      currentSlide.theme_variant === 'maroon'
                        ? 'bg-[#661414] text-[#F5EBDF]'
                        : 'bg-[#F5EBDF] text-[#351D1D]'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Brand Header */}
                      <div
                        className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-widest pb-2 border-b ${
                          currentSlide.theme_variant === 'maroon'
                            ? 'text-[#E6CBBD] border-[#F5EBDF]/20'
                            : 'text-[#B58777] border-[#E6CBBD]'
                        }`}
                      >
                        <span className="font-bold lowercase">steer</span>
                        <span>
                          {currentSlide.slide_number} / {carousel.slides.length}
                        </span>
                      </div>

                      {/* Serif Headline with Italic Accent */}
                      <h3
                        className={`font-serif text-xl sm:text-2xl font-bold leading-tight ${
                          currentSlide.theme_variant === 'maroon'
                            ? 'text-[#F5EBDF]'
                            : 'text-[#351D1D]'
                        }`}
                      >
                        {languageMode === 'HINGLISH' && currentSlide.hinglish_headline
                          ? currentSlide.hinglish_headline
                          : currentSlide.headline}
                      </h3>

                      {/* Body text */}
                      <p
                        className={`text-xs leading-relaxed ${
                          currentSlide.theme_variant === 'maroon'
                            ? 'text-[#E6CBBD]'
                            : 'text-[#351D1D]'
                        }`}
                      >
                        {languageMode === 'HINGLISH' && currentSlide.hinglish_body
                          ? currentSlide.hinglish_body
                          : currentSlide.body_text}
                      </p>

                      {/* Empirical Finding Card */}
                      {currentSlide.finding && (
                        <div
                          className={`p-3 border-l-2 text-xs font-serif italic ${
                            currentSlide.theme_variant === 'maroon'
                              ? 'bg-[#F5EBDF]/10 border-[#C04E2A] text-[#F5EBDF]'
                              : 'bg-[#F8F2EB] border-[#C04E2A] text-[#351D1D]'
                          }`}
                        >
                          "{currentSlide.finding}"
                        </div>
                      )}

                      {/* Handwritten Founder Note */}
                      {currentSlide.founder_note && (
                        <div className="font-handwritten text-[#C04E2A] text-lg sm:text-xl font-bold leading-snug">
                          {currentSlide.founder_note}
                        </div>
                      )}

                      {/* Scientific Caveat / Limitation */}
                      {currentSlide.caveat_or_limitation && (
                        <div className="p-2.5 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-[11px] text-[#C04E2A]">
                          <span className="font-bold font-mono text-[9px] uppercase block">
                            Study Limitation:
                          </span>
                          {currentSlide.caveat_or_limitation}
                        </div>
                      )}
                    </div>

                    {/* Footer sign-off */}
                    <div
                      className={`text-[10px] font-mono border-t pt-2 flex items-center justify-between ${
                        currentSlide.theme_variant === 'maroon'
                          ? 'text-[#E6CBBD]/80 border-[#F5EBDF]/20'
                          : 'text-[#B58777] border-[#E6CBBD]'
                      }`}
                    >
                      <span className="truncate max-w-[220px]">
                        {currentSlide.source_citation || activePaper.journal}
                      </span>
                      <span className="font-bold lowercase">steerclub.com</span>
                    </div>
                  </div>
                )}

                {/* Slide Actions */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E6CBBD] gap-2">
                  <div className="flex items-center gap-1">
                    {carousel.slides.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`w-6 h-6 text-[10px] font-mono rounded-xs border transition-colors cursor-pointer relative ${
                          currentSlideIndex === i
                            ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                            : 'border-[#E6CBBD] text-[#786A61] hover:bg-[#F8F2EB]'
                        }`}
                      >
                        {i + 1}
                        {s.invalidation_flag && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C04E2A]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAllSlidePngs}
                      className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-medium text-[#351D1D] rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>Download All Slides</span>
                    </button>

                    <button
                      onClick={() => {
                        if (currentSlide) {
                          downloadCarouselSlidePng(
                            currentSlide,
                            currentSlideIndex,
                            carousel.slides.length,
                            activePaper.title
                          );
                        }
                      }}
                      className="px-3 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>Download Slide PNG</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Slide Editor & Provenance Anchoring (5 Cols) */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <div className="border-b border-[#E6CBBD] pb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#B58777] font-semibold">
                    SLIDE PROVENANCE & EDITORIAL COPY
                  </span>
                  <span className="text-[10px] font-mono text-[#B58777]">
                    Slide {currentSlideIndex + 1}
                  </span>
                </div>

                {currentSlide && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                        Headline ({languageMode === 'HINGLISH' ? 'Hinglish' : 'English'})
                      </label>
                      <input
                        type="text"
                        value={
                          languageMode === 'HINGLISH' && currentSlide.hinglish_headline
                            ? currentSlide.hinglish_headline
                            : currentSlide.headline
                        }
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          if (languageMode === 'HINGLISH') {
                            updated[currentSlideIndex].hinglish_headline = e.target.value;
                          } else {
                            updated[currentSlideIndex].headline = e.target.value;
                          }
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                        Body Text
                      </label>
                      <textarea
                        value={
                          languageMode === 'HINGLISH' && currentSlide.hinglish_body
                            ? currentSlide.hinglish_body
                            : currentSlide.body_text
                        }
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          if (languageMode === 'HINGLISH') {
                            updated[currentSlideIndex].hinglish_body = e.target.value;
                          } else {
                            updated[currentSlideIndex].body_text = e.target.value;
                          }
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        rows={3}
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#C04E2A] block font-semibold mb-1">
                        Founder Handwritten Field Note
                      </label>
                      <input
                        type="text"
                        value={currentSlide.founder_note || ''}
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          updated[currentSlideIndex].founder_note = e.target.value;
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        placeholder="e.g. Doctor's note: It is biology, not willpower."
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-handwritten text-[#C04E2A] text-base"
                      />
                    </div>

                    {/* Mapped Upstream Claims */}
                    <div className="pt-2 border-t border-[#E6CBBD] space-y-2">
                      <span className="font-mono text-[10px] uppercase text-[#B58777] font-semibold block">
                        Underlying Scientific Claims
                      </span>

                      {currentSlide.mapped_claim_ids && currentSlide.mapped_claim_ids.length > 0 ? (
                        currentSlide.mapped_claim_ids.map((id) => {
                          const c = allClaims.find((item) => item.claim_id === id);
                          if (!c) return null;
                          return (
                            <div
                              key={c.claim_id}
                              className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1 text-[11px]"
                            >
                              <div className="flex items-center justify-between font-mono text-[9px]">
                                <span className="font-semibold text-[#661414]">{c.claim_id}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded-xs font-bold ${
                                    c.review_status === 'HUMAN_APPROVED'
                                      ? 'text-[#416C49] bg-[#416C49]/10'
                                      : 'text-[#C04E2A] bg-[#C04E2A]/10'
                                  }`}
                                >
                                  {c.review_status}
                                </span>
                              </div>
                              <p className="text-[#351D1D] font-medium leading-snug">{c.claim_text}</p>
                              {c.exact_supporting_quote && (
                                <p className="italic text-[#786A61] text-[10px]">
                                  "{c.exact_supporting_quote}"
                                </p>
                              )}
                              <button
                                onClick={() => onNavigateToDesk && onNavigateToDesk(c.claim_id)}
                                className="text-[10px] font-mono text-[#C04E2A] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Inspect Upstream Claim in Desk</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 text-xs text-[#B58777] bg-[#F8F2EB]">
                          No upstream claim mapped to this slide.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 p-8 text-center text-[#B58777]">
              Generate content to preview carousel deck.
            </div>
          )}
        </div>
      )}

      {/* 04. FORMAT 2: STATIC POST WORKSPACE */}
      {activeTab === 'static' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {staticPost ? (
            <>
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3 text-xs font-mono">
                  <span className="font-semibold text-[#661414]">1080×1080 EDITORIAL BRIEF</span>
                  <button
                    onClick={() => downloadStaticPostPng(staticPost, activePaper.title)}
                    className="px-3 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                    <span>Download Static PNG</span>
                  </button>
                </div>

                {/* Rendered Frame */}
                <div className="aspect-square max-w-[420px] mx-auto bg-[#F5EBDF] border border-[#E6CBBD] p-7 sm:p-8 flex flex-col justify-between shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#B58777] border-b border-[#E6CBBD] pb-2">
                      <span className="font-bold lowercase">steer</span>
                      <span>Single Study Brief</span>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#351D1D] leading-tight">
                      {languageMode === 'HINGLISH' && staticPost.hinglish_headline
                        ? staticPost.hinglish_headline
                        : staticPost.headline}
                    </h3>

                    <p className="text-xs text-[#351D1D] leading-relaxed">
                      {languageMode === 'HINGLISH' && staticPost.hinglish_supporting_text
                        ? staticPost.hinglish_supporting_text
                        : staticPost.supporting_text}
                    </p>

                    <div className="p-3 bg-[#F8F2EB] border-l-2 border-[#C04E2A] font-serif text-xs italic text-[#351D1D]">
                      "{staticPost.primary_finding}"
                    </div>

                    {staticPost.founder_note && (
                      <div className="font-handwritten text-[#C04E2A] text-lg font-bold">
                        {staticPost.founder_note}
                      </div>
                    )}

                    <div className="p-2.5 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-[11px] text-[#C04E2A]">
                      <span className="font-mono text-[9px] uppercase font-bold block">
                        Editorial Qualification:
                      </span>
                      {staticPost.qualification}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-[#B58777] border-t border-[#E6CBBD] pt-2 flex justify-between">
                    <span className="truncate max-w-[240px]">{staticPost.source_note}</span>
                    <span className="font-bold lowercase">steerclub.com</span>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#B58777] font-semibold block border-b border-[#E6CBBD] pb-2">
                  STATIC POST ATTRIBUTES
                </span>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={staticPost.headline}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, headline: e.target.value })
                      }
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-serif"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                      Supporting Context
                    </label>
                    <textarea
                      value={staticPost.supporting_text}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, supporting_text: e.target.value })
                      }
                      rows={3}
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#C04E2A] block font-semibold mb-1">
                      Founder Field Note
                    </label>
                    <input
                      type="text"
                      value={staticPost.founder_note || ''}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, founder_note: e.target.value })
                      }
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-handwritten text-[#C04E2A] text-base"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 p-8 text-center text-[#B58777]">
              Generate content to preview static post.
            </div>
          )}
        </div>
      )}

      {/* 05. FORMAT 3: AI VIDEO REEL WORKSPACE */}
      {activeTab === 'reel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {reel ? (
            <>
              {/* Left Column: Scene Script Ledger (7 Cols) */}
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] pb-2 text-xs font-mono gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#661414]">
                      SCENE-BY-SCENE REEL SCRIPT
                    </span>
                    <span>·</span>
                    <span className="text-[#B58777]">{reel.total_duration_sec}s Total</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Voiceover Toggle */}
                    <button
                      onClick={handleToggleVoiceoverAudio}
                      className={`px-2.5 py-1 text-xs font-medium border rounded-xs flex items-center gap-1 cursor-pointer transition-colors ${
                        isVoiceoverAudioActive
                          ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                          : 'bg-[#FFFDF9] text-[#786A61] border-[#E6CBBD] hover:bg-[#F8F2EB]'
                      }`}
                    >
                      {isVoiceoverAudioActive ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      <span>{isVoiceoverAudioActive ? 'Voiceover (ON)' : 'Audio (Muted)'}</span>
                    </button>

                    <button
                      onClick={handleToggleReelPlay}
                      className="px-3 py-1 text-xs font-semibold bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isPlayingReel ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlayingReel ? 'Pause Reel' : 'Play AI Reel'}</span>
                    </button>
                  </div>
                </div>

                {/* Timeline Progress Bar */}
                <div className="w-full bg-[#F5EBDF] h-2 overflow-hidden rounded-xs">
                  <div
                    className="bg-[#C04E2A] h-2 transition-all duration-300"
                    style={{
                      width: `${(reelElapsedSeconds / (reel.total_duration_sec || 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Scene Rows */}
                <div className="space-y-3">
                  {reel.scenes.map((scene, idx) => {
                    const isCurrent = currentReelSceneIndex === idx && isPlayingReel;
                    const mappedClaims = (scene.mapped_claim_ids || [])
                      .map((id) => allClaims.find((c) => c.claim_id === id))
                      .filter(Boolean) as ClaimRecord[];

                    return (
                      <div
                        key={scene.scene_number}
                        className={`p-3.5 border transition-colors space-y-2 ${
                          isCurrent
                            ? 'bg-[#C04E2A]/10 border-[#C04E2A]'
                            : 'bg-[#FFFDF9] border-[#E6CBBD]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#B58777]">
                          <span className="font-semibold text-[#661414]">
                            SCENE {scene.scene_number} ({scene.duration_sec}s)
                          </span>
                          <span className="truncate max-w-[220px]">
                            B-Roll: {scene.visual_cue}
                          </span>
                        </div>

                        <div className="text-xs text-[#351D1D]">
                          <span className="font-mono text-[10px] uppercase text-[#B58777] font-semibold block mb-0.5">
                            Voiceover ({languageMode === 'HINGLISH' ? 'Hinglish' : 'English'}):
                          </span>
                          <p className="font-serif leading-relaxed italic text-sm">
                            "
                            {languageMode === 'HINGLISH' && scene.hinglish_voiceover
                              ? scene.hinglish_voiceover
                              : scene.voiceover_script}
                            "
                          </p>
                        </div>

                        {scene.on_screen_text && (
                          <div className="text-[11px] font-mono text-[#C04E2A] bg-[#F5EBDF] p-1.5 border border-[#E6CBBD]">
                            On-screen: {scene.on_screen_text}
                          </div>
                        )}

                        {mappedClaims.length > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#B58777]">
                            <span>Evidence Anchor:</span>
                            {mappedClaims.map((c) => (
                              <button
                                key={c.claim_id}
                                onClick={() => onNavigateToDesk && onNavigateToDesk(c.claim_id)}
                                className="text-[#C04E2A] hover:underline bg-[#F5EBDF] px-1.5 py-0.2 rounded-xs border border-[#E6CBBD] cursor-pointer"
                              >
                                {c.claim_id} ({c.review_status})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 9:16 Vertical Simulator (5 Cols) */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2 text-xs font-mono">
                  <span className="font-semibold text-[#661414]">9:16 REEL SIMULATOR</span>
                  <span className="text-[#B58777]">
                    {reelElapsedSeconds}s / {reel.total_duration_sec}s
                  </span>
                </div>

                {/* 9:16 Phone Frame */}
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-[#351D1D] text-[#F5EBDF] p-5 flex flex-col justify-between border-2 border-[#351D1D] rounded-lg shadow-md relative overflow-hidden">
                  {/* Simulated B-Roll Background Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#351D1D]/90 via-[#661414]/80 to-[#351D1D]/95 pointer-events-none" />

                  {/* Header Bar */}
                  <div className="relative z-10 flex justify-between text-[9px] font-mono uppercase text-[#E6CBBD] border-b border-[#F5EBDF]/20 pb-1.5">
                    <span className="font-bold lowercase">steer</span>
                    <span>Scene {reel.scenes[currentReelSceneIndex]?.scene_number || 1}</span>
                  </div>

                  {/* Center Content */}
                  <div className="relative z-10 text-center space-y-3 my-auto">
                    <span className="text-[10px] font-mono uppercase text-[#C04E2A] bg-[#F5EBDF] px-2 py-0.5 rounded-xs font-bold inline-block">
                      {reel.scenes[currentReelSceneIndex]?.visual_cue.substring(0, 32)}...
                    </span>

                    <h4 className="font-serif text-lg font-bold leading-snug text-[#F5EBDF]">
                      {reel.scenes[currentReelSceneIndex]?.on_screen_text || reel.title}
                    </h4>

                    {/* Word-by-word Subtitle Simulator */}
                    <div className="p-2.5 bg-[#351D1D]/80 border border-[#E6CBBD]/30 rounded-xs text-xs font-mono text-[#F5EBDF] leading-tight">
                      <span className="text-[#C04E2A] font-bold">"</span>
                      {languageMode === 'HINGLISH' &&
                      reel.scenes[currentReelSceneIndex]?.hinglish_subtitle
                        ? reel.scenes[currentReelSceneIndex].hinglish_subtitle
                        : reel.scenes[currentReelSceneIndex]?.subtitle_text || 'Listening...'}
                      <span className="text-[#C04E2A] font-bold">"</span>
                    </div>
                  </div>

                  {/* Bottom Instagram overlay bar */}
                  <div className="relative z-10 border-t border-[#F5EBDF]/20 pt-2 text-[9px] font-mono text-[#E6CBBD] flex justify-between">
                    <span>@steerclub</span>
                    <span className="lowercase">steerclub.com</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-[#B58777]">
                    Simulates vertical Instagram Reels with live Web Speech voiceover synthesis.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 p-8 text-center text-[#B58777]">
              Generate content to preview vertical reel.
            </div>
          )}
        </div>
      )}

      {/* 06. FORMAT 4: CAPTIONS & HASHTAGS */}
      {activeTab === 'caption' && (
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#351D1D]">
                Instagram Captions & Methodological Disclosure
              </h3>
              <p className="text-xs text-[#B58777]">
                Calibrated for Instagram growth in Steer's calm, doctor-led tone.
              </p>
            </div>

            <button
              onClick={() =>
                handleCopyCaption(
                  (languageMode === 'HINGLISH' && carousel?.hinglish_caption
                    ? carousel.hinglish_caption
                    : carousel?.caption || '') +
                    '\n\n' +
                    (carousel?.hashtags.join(' ') || '')
                )
              }
              className="px-3 py-1.5 bg-[#C04E2A] hover:bg-[#a63f1f] text-[#FFFDF9] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Caption & Tags'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#F5EBDF] border border-[#E6CBBD] text-xs font-sans text-[#351D1D] leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
            {languageMode === 'HINGLISH' && carousel?.hinglish_caption
              ? carousel.hinglish_caption
              : carousel?.caption}

            {'\n\n'}
            {carousel?.hashtags.join(' ')}
          </div>
        </div>
      )}
    </div>
  );
};
