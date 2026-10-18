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
}) => {
  const { user, signInWithGoogle, signOutUser, loading: authLoading } = useAuth();

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
      icon: Bookmark,
    },
    {
      id: 'desk',
      label: 'Investigation Desk',
      icon: FlaskConical,
      badge: totalClaimsCount > 0 ? `${totalClaimsCount} Claims` : undefined,
      badgeStyle: 'bg-[#661414]/10 text-[#661414]',
    },
    {
      id: 'graph',
      label: 'Provenance Graph',
      icon: Layers,
    },
    {
      id: 'review',
      label: 'Claim Review',
      icon: CheckCircle2,
      badge:
        flaggedClaimsCount > 0
          ? `${flaggedClaimsCount} flagged`
          : totalClaimsCount > 0
          ? `${approvedClaimsCount}/${totalClaimsCount}`
          : undefined,
      badgeStyle:
        flaggedClaimsCount > 0
          ? 'bg-[#C04E2A]/15 text-[#C04E2A] border border-[#C04E2A]/30'
          : approvedClaimsCount > 0
          ? 'bg-[#416C49]/15 text-[#416C49] border border-[#416C49]/30'
          : 'bg-[#E6CBBD] text-[#351D1D]',
    },
    {
      id: 'studio',
      label: 'Content Studio',
      icon: Layers,
      badge: 'Canva & Reels',
      badgeStyle: 'bg-[#C04E2A]/10 text-[#C04E2A]',
    },
    {
      id: 'schedule',
      label: 'Content Calendar',
      icon: Calendar,
      badge: '7 Days',
      badgeStyle: 'bg-[#C04E2A]/10 text-[#C04E2A]',
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
      badge: papers.length > 0 ? String(papers.length) : undefined,
    },
    {
      id: 'evidence',
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
    },
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
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic text-xl font-bold text-[#74191D] tracking-tight">
              steer
            </span>
            <span className="text-[10px] font-mono font-semibold tracking-[0.2em] uppercase text-[#391E1D]/70">
              STITCH
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-wider uppercase text-[#786A61] border border-[#DED2C5] px-1.5 py-0.5 rounded-xs bg-[#F5EFE6]">
            DESK
          </span>
        </div>

        {/* Active Paper Document Switcher */}
        <div className="px-3.5 py-3 border-b border-[#DED2C5] bg-[#FFFDF9]/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
              ACTIVE SOURCE
            </span>
            {activePaper?.is_demo && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#BB4B2D] font-bold">
                DEMO
              </span>
            )}
          </div>

          {activePaper ? (
            <div className="space-y-1">
              <div
                className="font-serif text-xs font-semibold text-[#391E1D] line-clamp-2 leading-snug cursor-pointer hover:text-[#74191D]"
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
              className="w-full text-left py-1 text-xs text-[#74191D] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ingest paper...</span>
            </button>
          )}

          {papers.length > 1 && (
            <div className="mt-2 pt-2 border-t border-[#DED2C5] flex items-center justify-between text-[10px]">
              <span className="text-[#786A61] font-mono">Switch:</span>
              <select
                value={activePaper?.paper_id}
                onChange={(e) => onSwitchPaper(e.target.value)}
                className="bg-[#FFFDF9] border border-[#DED2C5] text-[#391E1D] text-[10px] font-medium py-0.5 px-1.5 rounded-xs max-w-[130px] truncate cursor-pointer focus:outline-none focus:border-[#74191D]"
              >
                {papers.map((p) => (
                  <option key={p.paper_id} value={p.paper_id}>
                    {p.title.substring(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer group text-left ${
                  isActive
                    ? 'bg-[#FFFDF9] text-[#74191D] font-semibold border-l-2 border-[#74191D] shadow-xs'
                    : 'text-[#391E1D]/85 hover:text-[#391E1D] hover:bg-[#FFFDF9]/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#74191D]' : 'text-[#786A61] group-hover:text-[#391E1D]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                      item.badgeStyle ||
                      (isActive
                        ? 'bg-[#74191D]/10 text-[#74191D]'
                        : 'bg-[#DED2C5] text-[#391E1D]')
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

      {/* Footer: Cloud SQL Status & User Session */}
      <div className="p-3 border-t border-[#DED2C5] bg-[#FFFDF9] space-y-2">
        {/* Cloud SQL Connection Status */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#416C49]" />
            <span>Cloud SQL (us-west1)</span>
          </div>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              sqlSyncStatus === 'synced'
                ? 'bg-[#416C49]'
                : sqlSyncStatus === 'syncing'
                ? 'bg-[#BB4B2D]'
                : 'bg-[#DED2C5]'
            }`}
            title={`Status: ${sqlSyncStatus}`}
          />
        </div>

        {/* User Account / Google Sign-In */}
        {authLoading ? (
          <div className="py-1 text-[11px] text-[#786A61] font-mono">Checking session...</div>
        ) : user ? (
          <div className="pt-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-[#DED2C5]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#74191D] text-[#FFFDF9] flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-medium text-[#391E1D] truncate max-w-[100px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={signOutUser}
              className="text-[#786A61] hover:text-[#BB4B2D] transition-colors p-1 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-[11px] font-medium text-[#391E1D] cursor-pointer transition-colors"
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
            className="w-full text-left text-[10px] font-mono text-[#786A61] hover:text-[#74191D] pt-1 flex items-center justify-between cursor-pointer"
          >
            <span>Benchmark Dataset</span>
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </aside>
  );
};
