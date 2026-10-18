import React from 'react';
import { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCheck,
  FlaskConical,
  Database,
  LogOut,
  RotateCcw,
  Plus,
  BookOpen,
  Calendar,
  Award,
  ChevronDown,
} from 'lucide-react';

export type ActiveTab =
  | 'workspace'
  | 'desk'
  | 'graph'
  | 'papers'
  | 'evidence'
  | 'review'
  | 'studio'
  | 'schedule'
  | 'submission'
  | 'report'
  | 'selftest';

interface NavigationSidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
  papers: PaperRecord[];
  onSwitchPaper: (paperId: string) => void;
  approvedClaimsCount: number;
  totalClaimsCount: number;
  flaggedClaimsCount: number;
  sqlSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onOpenDemo?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAuthModal?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
  papers,
  onSwitchPaper,
  approvedClaimsCount,
  totalClaimsCount,
  flaggedClaimsCount,
  sqlSyncStatus,
  onOpenDemo,
  isOpenMobile = false,
  onCloseMobile,
  onOpenAuthModal,
}) => {
  const { user, signOutUser, loading: authLoading } = useAuth();

  // Core 5 Stages for Problem Statement 2
  const coreSections: {
    id: ActiveTab;
    label: string;
    sectionNumber: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeStyle?: string;
  }[] = [
    {
      id: 'studio',
      label: 'Instagram Studio',
      sectionNumber: '01',
      icon: Layers,
      badge: 'Live Feed & Copy',
      badgeStyle: 'bg-[#C04E2A] text-[#F5EBDF] font-bold',
    },
    {
      id: 'papers',
      label: 'Paper Ingestion',
      sectionNumber: '02',
      icon: FileText,
      badge: papers.length > 0 ? `${papers.length} Papers` : undefined,
      badgeStyle: 'bg-[#661414]/10 text-[#661414]',
    },
    {
      id: 'review',
      label: 'Doctor Review Gate',
      sectionNumber: '03',
      icon: CheckCircle2,
      badge:
        flaggedClaimsCount > 0
          ? `${flaggedClaimsCount} flagged`
          : totalClaimsCount > 0
          ? `${approvedClaimsCount}/${totalClaimsCount} OK`
          : undefined,
      badgeStyle:
        flaggedClaimsCount > 0
          ? 'bg-[#C04E2A]/15 text-[#C04E2A] border border-[#C04E2A]/30'
          : 'bg-[#416C49]/15 text-[#416C49] border border-[#416C49]/30',
    },
    {
      id: 'schedule',
      label: '7-Day Calendar',
      sectionNumber: '04',
      icon: Calendar,
      badge: 'Instagram',
      badgeStyle: 'bg-[#661414]/10 text-[#661414]',
    },
    {
      id: 'submission',
      label: 'Pitch & Loom Script',
      sectionNumber: '05',
      icon: Award,
      badge: 'PS2 Winner',
      badgeStyle: 'bg-[#661414] text-[#F5EBDF] font-bold',
    },
  ];

  // Deep Tools
  const secondaryTools: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'desk', label: 'Investigation Desk', icon: FlaskConical },
    { id: 'graph', label: 'Provenance Graph', icon: Layers },
    { id: 'evidence', label: 'Verbatim Passages', icon: BookOpen },
    { id: 'report', label: 'Audit Report', icon: FileCheck },
    { id: 'selftest', label: '12 Rules Engine', icon: AlertTriangle },
  ];


  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[230px] bg-[#F5EFE6] border-r border-[#DED2C5] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand & Workspace Context */}
      <div className="flex flex-col">
        {/* Masthead */}
        <div className="h-14 px-4 border-b border-[#DED2C5] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={() => handleNavClick('studio')}>
            <span className="font-serif italic text-xl font-black text-[#661414] tracking-tight">
              steer
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#786A61]">
              STUDIO
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-wider uppercase text-[#661414] border border-[#661414]/30 px-1.5 py-0.5 rounded-xs bg-[#661414]/5 font-bold">
            PS2 WINNER
          </span>
        </div>

        {/* Active Paper Document Switcher - Redesigned & Clean */}
        <div className="p-3.5 border-b border-[#DED2C5] bg-[#F8F2EB]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#661414] font-bold flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#C04E2A]" />
              ACTIVE SOURCE
            </span>
            {activePaper?.is_demo && (
              <span className="text-[9px] font-mono uppercase tracking-wider bg-[#C04E2A]/10 text-[#C04E2A] px-1.5 py-0.5 rounded-xs font-bold">
                DEMO
              </span>
            )}
          </div>

          {activePaper ? (
            <div className="space-y-2.5">
              <div
                className="p-2.5 bg-[#FFFDF9] border border-[#DED2C5] rounded-lg shadow-2xs space-y-1 cursor-pointer hover:border-[#661414] transition-colors"
                onClick={() => handleNavClick('papers')}
                title="Click to view full paper details"
              >
                <div className="font-serif text-xs font-bold text-[#351D1D] line-clamp-2 leading-snug">
                  {activePaper.title}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8B6A60]">
                  <span>{activePaper.year}</span>
                  <span className="truncate max-w-[120px]">{activePaper.journal || 'Research Journal'}</span>
                </div>
              </div>

              {/* Prominent Paper Switcher Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B6A60] block font-medium">
                  Switch Active Research Paper ({papers.length}):
                </label>
                <div className="relative">
                  <select
                    value={activePaper?.paper_id}
                    onChange={(e) => onSwitchPaper(e.target.value)}
                    className="w-full bg-[#FFFDF9] border border-[#351D1D]/20 text-[#351D1D] text-xs font-semibold py-2 px-2.5 rounded-lg shadow-2xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#661414]/30 focus:border-[#661414]"
                  >
                    {papers.map((p) => (
                      <option key={p.paper_id} value={p.paper_id}>
                        {p.title.length > 38 ? p.title.substring(0, 38) + '...' : p.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#351D1D]">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('papers')}
              className="w-full py-2 px-3 bg-[#FFFDF9] border border-dashed border-[#351D1D]/30 rounded-lg text-xs font-semibold text-[#661414] hover:bg-[#F5EBDF] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest New Research Paper</span>
            </button>
          )}
        </div>

        {/* Primary 5-Stage Pipeline Navigation */}
        <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
          PIPELINE STAGES
        </div>
        <nav className="px-2 space-y-1">
          {coreSections.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium transition-all rounded-xs cursor-pointer group text-left ${
                  isActive
                    ? 'bg-[#661414] text-[#F5EBDF] font-bold shadow-xs'
                    : 'text-[#351D1D] hover:text-[#661414] hover:bg-[#FFFDF9]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded-xs font-bold ${
                      isActive ? 'bg-[#C04E2A] text-[#F5EBDF]' : 'bg-[#DED2C5] text-[#351D1D]'
                    }`}
                  >
                    {item.sectionNumber}
                  </span>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#F5EBDF]' : 'text-[#786A61] group-hover:text-[#661414]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                      isActive
                        ? 'bg-[#F5EBDF]/20 text-[#F5EBDF]'
                        : item.badgeStyle || 'bg-[#DED2C5] text-[#351D1D]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Secondary Audit & Inspector Tools */}
        <div className="mt-3 px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold border-t border-[#DED2C5]/70">
          DEEP AUDITING
        </div>
        <nav className="px-2 space-y-0.5">
          {secondaryTools.map((tool) => {
            const isActive = currentTab === tool.id;
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleNavClick(tool.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium transition-colors rounded-xs cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#FFFDF9] text-[#661414] font-bold border-l-2 border-[#661414]'
                    : 'text-[#786A61] hover:text-[#351D1D] hover:bg-[#FFFDF9]/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tool.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: Cloud SQL Status & User Session */}
      <div className="p-3 border-t border-[#DED2C5] bg-[#FFFDF9] space-y-2">
        {/* Cloud SQL Connection Status */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#416C49]" />
            <span>Cloud SQL Database</span>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-[#416C49]"
            title={`Status: ${sqlSyncStatus}`}
          />
        </div>

        {/* User Account / Google Sign-In */}
        {authLoading ? (
          <div className="py-1 text-[11px] text-[#786A61] font-mono">Checking session...</div>
        ) : user ? (
          <div className="pt-1 flex items-center justify-between text-xs">
            <div
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-[#416C49]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#661414] text-[#FFFDF9] flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-semibold text-[#351D1D] truncate max-w-[100px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={signOutUser}
              className="text-[#786A61] hover:text-[#C04E2A] transition-colors p-1 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (onOpenAuthModal) onOpenAuthModal();
            }}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-[11px] font-medium text-[#351D1D] cursor-pointer transition-colors shadow-xs"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        )}

        {/* Demo reset trigger */}
        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="w-full text-left text-[10px] font-mono text-[#786A61] hover:text-[#661414] pt-1 flex items-center justify-between cursor-pointer"
          >
            <span>Reset Demo Workspace</span>
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

