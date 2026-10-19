import React, { useState } from 'react';
import { Menu, PanelRightClose, PanelRightOpen, Database, Sparkles, UserCheck, LogIn, ChevronDown, Layers } from 'lucide-react';
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
      <header className="h-12 bg-[#FFFDF9] border-b border-[#DED2C5] px-4 flex items-center justify-end gap-3 shrink-0 sticky top-0 z-30 shadow-xs">
        {/* Right: Icons including and after SQL: connected */}
        <div className="flex items-center gap-2">
          {/* Cloud SQL Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-[#DED2C5] bg-[#FFFDF9] text-[#351D1D] rounded-xs shadow-xs"
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
            <span className="font-semibold">{sqlSyncStatus === 'syncing' ? 'Syncing...' : 'Synchronized'}</span>
          </div>

          {/* Investigation tab button */}
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('desk')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-xs transition-colors cursor-pointer ${
                currentTab === 'desk'
                  ? 'bg-[#F4EBE1] text-[#661414] border-[#661414] font-semibold'
                  : 'bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#351D1D] border-[#DED2C5]'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-[#661414]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.31L4.69 18.2A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.71-2.8L14 9.31V2" />
                <path d="M8.5 2h7" />
                <path d="M14 9.3h-4" />
              </svg>
              <span className="hidden sm:inline">Investigation</span>
            </button>
          )}

          {/* Graph tab button */}
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('provenance')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-xs transition-colors cursor-pointer ${
                currentTab === 'provenance'
                  ? 'bg-[#F4EBE1] text-[#661414] border-[#661414] font-semibold shadow-xs'
                  : 'bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#351D1D] border-[#DED2C5]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#C04E2A]" />
              <span>Graph</span>
            </button>
          )}

          {/* Inspector button */}
          <button
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              isInspectorOpen
                ? 'bg-[#661414] text-[#F5EBDF] border-[#661414] font-semibold'
                : 'bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#351D1D] border-[#DED2C5]'
            }`}
            title={isInspectorOpen ? 'Collapse evidence inspector' : 'Expand evidence inspector'}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#F5EBDF]" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-[#661414]" />
            )}
            <span className="hidden sm:inline">Inspector</span>
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

