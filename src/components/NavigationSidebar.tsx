import React from 'react';
import {
  PaperRecord,
  ClaimRecord,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  BookOpen,
  Plus,
  RefreshCw,
  LogOut,
  Database,
  UserCheck,
  FileCheck,
  AlertTriangle,
  FlaskConical,
  Compass,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'workspace'
  | 'desk'
  | 'provenance'
  | 'review'
  | 'studio'
  | 'schedule'
  | 'submission'
  | 'papers'
  | 'source'
  | 'report'
  | 'selftest'
  | 'audit';

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

  // Navigation Items matching image.png exactly
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeStyle?: string;
  }[] = [
    {
      id: 'workspace',
      label: 'Workbench',
      icon: Compass,
    },
    {
      id: 'desk',
      label: 'Investigation Desk',
      icon: FlaskConical,
      badge: `${totalClaimsCount} Claims`,
      badgeStyle: 'bg-[#F4EBE1] text-[#661414]',
    },
    {
      id: 'provenance',
      label: 'Provenance Graph',
      icon: Layers,
    },
    {
      id: 'review',
      label: 'Claim Review',
      icon: CheckCircle2,
      badge: `${approvedClaimsCount}/${totalClaimsCount}`,
      badgeStyle: 'bg-[#416C49]/15 text-[#416C49]',
    },
    {
      id: 'studio',
      label: 'Content Studio',
      icon: Layers,
      badge: 'Canva & Reels',
      badgeStyle: 'bg-[#C04E2A]/15 text-[#C04E2A]',
    },
    {
      id: 'schedule',
      label: 'Content Calendar',
      icon: Calendar,
      badge: '7 Days',
      badgeStyle: 'bg-[#C04E2A]/15 text-[#C04E2A]',
    },
    {
      id: 'submission',
      label: 'Submission & Pitch',
      icon: Award,
      badge: 'PS2',
      badgeStyle: 'bg-[#661414] text-[#F5EBDF] font-bold',
    },
    {
      id: 'papers',
      label: 'Paper Intake',
      icon: FileText,
      badge: papers.length > 0 ? `${papers.length}` : undefined,
      badgeStyle: 'bg-[#661414]/10 text-[#661414]',
    },
    {
      id: 'source',
      label: 'Evidence Stitch',
      icon: BookOpen,
    },
    {
      id: 'report',
      label: 'Evidence Report',
      icon: FileCheck,
    },
    {
      id: 'selftest',
      label: 'Validation Engine',
      icon: AlertTriangle,
      badge: '12 Rules',
      badgeStyle: 'bg-[#661414]/10 text-[#661414]',
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: ShieldCheck,
      badge: 'All Users',
      badgeStyle: 'bg-[#416C49]/15 text-[#416C49]',
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[230px] bg-[#FAF6F0] border-r border-[#E6CBBD] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand & Workspace Context - Scrollable Navigation */}
      <div className="flex flex-col overflow-y-auto min-h-0 flex-1">
        {/* Masthead (matches image.png) */}
        <div className="h-14 px-4 border-b border-[#E6CBBD] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={() => handleNavClick('workspace')}>
            <span className="font-serif italic text-xl font-black text-[#661414] tracking-tight">
              steer
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#786A61]">
              STITCH
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-wider uppercase text-[#786A61] border border-[#E6CBBD] px-1.5 py-0.5 rounded-xs bg-[#FAF6F0] font-semibold">
            DESK
          </span>
        </div>

        {/* Active Source Card (matches image.png) */}
        <div className="px-3.5 py-3 border-b border-[#E6CBBD] bg-[#FFFDF9]/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
              ACTIVE SOURCE
            </span>
            {activePaper?.is_demo && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#C04E2A] font-bold">
                DEMO
              </span>
            )}
          </div>

          {activePaper ? (
            <div className="space-y-1">
              <div
                className="font-serif text-xs font-semibold text-[#351D1D] line-clamp-2 leading-snug cursor-pointer hover:text-[#661414]"
                onClick={() => handleNavClick('papers')}
                title={activePaper.title}
              >
                {activePaper.title}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#786A61]">
                <span>{activePaper.year}</span>
                <span>·</span>
                <span className="truncate max-w-[110px]">{activePaper.journal || 'Journal'}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('papers')}
              className="w-full text-left py-1 text-xs text-[#661414] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ingest paper...</span>
            </button>
          )}

          {papers.length > 1 && (
            <div className="mt-2 pt-2 border-t border-[#E6CBBD] flex items-center justify-between text-[10px]">
              <span className="text-[#786A61] font-mono">Switch:</span>
              <select
                value={activePaper?.paper_id}
                onChange={(e) => onSwitchPaper(e.target.value)}
                className="bg-[#FFFDF9] border border-[#E6CBBD] text-[#351D1D] text-[10px] font-medium py-0.5 px-1.5 rounded-xs max-w-[130px] truncate cursor-pointer focus:outline-none focus:border-[#661414]"
              >
                {papers.map((p) => (
                  <option key={p.paper_id} value={p.paper_id}>
                    {p.title.substring(0, 22)}...
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation list matching image.png */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium transition-all rounded-xs cursor-pointer group text-left ${
                  isActive
                    ? 'bg-[#F4EBE1] text-[#661414] font-bold border-l-2 border-[#661414]'
                    : 'text-[#351D1D] hover:text-[#661414] hover:bg-[#FFFDF9]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-[#661414]' : 'text-[#786A61] group-hover:text-[#661414]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                      isActive
                        ? 'bg-[#661414]/15 text-[#661414]'
                        : item.badgeStyle || 'bg-[#E6CBBD]/50 text-[#351D1D]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: Cloud SQL Status & Reset Demo */}
      <div className="p-3 border-t border-[#E6CBBD] bg-[#FFFDF9] space-y-2">
        {/* Cloud SQL Connection Status */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#416C49]" />
            <span>Cloud SQL Sync</span>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-[#416C49]"
            title={`Status: ${sqlSyncStatus}`}
          />
        </div>

        {/* Demo reset button */}
        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="w-full text-left py-1 text-[11px] text-[#786A61] hover:text-[#661414] font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo Workspace</span>
          </button>
        )}
      </div>
    </aside>
  );
};
