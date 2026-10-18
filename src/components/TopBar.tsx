import React, { useState } from 'react';
import { Menu, PanelRightClose, PanelRightOpen, Database, Sparkles, UserCheck, LogIn, ChevronDown } from 'lucide-react';
import { ActiveTab } from './NavigationSidebar';
import { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';

interface TopBarProps {
  currentTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
  onToggleSidebarMobile: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  sqlSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
  onToggleSidebarMobile,
  isInspectorOpen,
  onToggleInspector,
  sqlSyncStatus,
  onQuickAction,
  quickActionLabel,
}) => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Grouped into 5 clear, logical sections
  const navSections: { id: ActiveTab; label: string; badge?: string }[] = [
    { id: 'studio', label: '1. Instagram Studio', badge: 'Live Feed' },
    { id: 'papers', label: '2. Ingest Papers' },
    { id: 'review', label: '3. Evidence & Review' },
    { id: 'schedule', label: '4. Calendar', badge: '7-Day' },
    { id: 'submission', label: '5. Pitch & Video' },
  ];

  return (
    <>
      <header className="h-14 bg-[#FFFDF9] border-b border-[#DED2C5] px-4 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-30 shadow-xs">
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-1.5 text-[#351D1D] hover:bg-[#F5EFE6] rounded-xs cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onSelectTab && onSelectTab('studio')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="font-serif italic text-xl font-black text-[#661414] tracking-tight group-hover:opacity-90">
              steer
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#661414]/10 text-[#661414] px-1.5 py-0.5 rounded-xs">
              EVIDENCE STUDIO
            </span>
          </div>
        </div>

        {/* Center: Clean 5-Stage Section Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navSections.map((sec) => {
            const isActive =
              currentTab === sec.id ||
              (sec.id === 'papers' && currentTab === 'workspace') ||
              (sec.id === 'review' && (currentTab === 'desk' || currentTab === 'graph' || currentTab === 'evidence'));
            return (
              <button
                key={sec.id}
                onClick={() => onSelectTab && onSelectTab(sec.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#661414] text-[#F5EBDF] shadow-xs'
                    : 'text-[#786A61] hover:text-[#351D1D] hover:bg-[#F5EFE6]'
                }`}
              >
                <span>{sec.label}</span>
                {sec.badge && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded-xs uppercase ${
                      isActive ? 'bg-[#C04E2A] text-[#F5EBDF]' : 'bg-[#DED2C5] text-[#351D1D]'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Cloud SQL, Google Auth & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud SQL Status Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border border-[#DED2C5] bg-[#F5EFE6] text-[#351D1D] rounded-xs"
            title="PostgreSQL Cloud SQL synchronization"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sqlSyncStatus === 'synced'
                  ? 'bg-[#416C49]'
                  : sqlSyncStatus === 'syncing'
                  ? 'bg-[#C04E2A]'
                  : 'bg-[#416C49]'
              }`}
            />
            <span className="text-[#786A61]">SQL:</span>
            <span className="font-semibold">{sqlSyncStatus === 'syncing' ? 'Syncing...' : 'Live'}</span>
          </div>

          {/* Quick Action: Run Automated Pipeline */}
          {onQuickAction && quickActionLabel && (
            <button
              onClick={onQuickAction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#C04E2A] hover:bg-[#a64020] text-[#FFFDF9] rounded-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{quickActionLabel}</span>
              <span className="md:hidden">Run</span>
            </button>
          )}

          {/* Google Sign-In Profile Button */}
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium border border-[#416C49]/40 bg-[#416C49]/10 text-[#416C49] rounded-xs hover:bg-[#416C49]/20 transition-colors cursor-pointer"
              title="Signed in via Google OAuth / Reviewer Session"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Doctor'}
                  className="w-5 h-5 rounded-full object-cover border border-[#416C49]"
                />
              ) : (
                <UserCheck className="w-4 h-4 text-[#416C49]" />
              )}
              <span className="hidden sm:inline font-bold truncate max-w-[120px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-[#416C49]" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] text-[#351D1D] rounded-xs transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>Sign In</span>
            </button>
          )}

          {/* Evidence Inspector Toggle */}
          <button
            onClick={onToggleInspector}
            className={`hidden xl:flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              isInspectorOpen
                ? 'bg-[#F5EFE6] text-[#661414] border-[#661414]/40 font-semibold'
                : 'bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#786A61] border-[#DED2C5]'
            }`}
            title={isInspectorOpen ? 'Collapse evidence inspector' : 'Expand evidence inspector'}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#661414]" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
            <span>Evidence</span>
          </button>
        </div>
      </header>

      {/* Google Sign In & Auth Portal Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        sqlSyncStatus={sqlSyncStatus}
      />
    </>
  );
};

