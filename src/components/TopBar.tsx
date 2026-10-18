import React from 'react';
import { Menu, PanelRightClose, PanelRightOpen, Database, Sparkles } from 'lucide-react';
import { ActiveTab } from './NavigationSidebar';
import { PaperRecord } from '../types';

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
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'workspace':
        return 'Editorial Work Queue';
      case 'desk':
        return 'Investigation Desk';
      case 'graph':
        return 'Claim Provenance Graph';
      case 'papers':
        return 'Paper Intake & Library';
      case 'evidence':
        return 'Evidence Stitch';
      case 'review':
        return 'Claim Review Ledger';
      case 'studio':
        return 'Content Studio';
      case 'schedule':
        return 'Content Calendar & Schedule';
      case 'submission':
        return 'Hackathon Submission Packet';
      case 'report':
        return 'Evidence Audit Report';
      case 'selftest':
        return 'Validation Suite';
    }
  };

  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'workspace', label: 'Workbench' },
    { id: 'desk', label: 'Investigation Desk' },
    { id: 'graph', label: 'Provenance Graph' },
    { id: 'review', label: 'Claim Review' },
    { id: 'studio', label: 'Content Studio' },
    { id: 'schedule', label: 'Calendar' },
    { id: 'submission', label: 'Submission' },
  ];

  return (
    <header className="h-14 bg-[#FFFDF9] border-b border-[#DED2C5] px-4 flex items-center justify-between gap-8 shrink-0 sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebarMobile}
          className="md:hidden p-1 text-[#391E1D] hover:bg-[#F5EFE6] rounded-xs cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onSelectTab) onSelectTab('workspace');
          }}
          className="font-serif italic text-lg font-bold text-[#74191D] tracking-tight whitespace-nowrap shrink-0 hover:opacity-90"
        >
          steer / stitch
        </a>
      </div>

      {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#786A61] shrink-0">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab && onSelectTab(link.id)}
              className={`whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#74191D] font-bold border-b border-[#74191D] pb-0.5'
                  : 'hover:text-[#391E1D]'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border border-[#DED2C5] bg-[#F5EFE6] text-[#391E1D] rounded-xs"
          title="Cloud SQL PostgreSQL synchronized in us-west1"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              sqlSyncStatus === 'synced'
                ? 'bg-[#416C49]'
                : sqlSyncStatus === 'syncing'
                ? 'bg-[#BB4B2D]'
                : 'bg-[#DED2C5]'
            }`}
          />
          <span className="text-[#786A61]">SQL:</span>
          <span className="tabular-nums">
            {sqlSyncStatus === 'synced' ? 'Synchronized' : sqlSyncStatus}
          </span>
        </div>

        {onQuickAction && quickActionLabel && (
          <button
            onClick={onQuickAction}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#74191D] hover:bg-[#5b1317] text-[#FFFDF9] rounded-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3" />
            <span>{quickActionLabel}</span>
          </button>
        )}

        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
            isInspectorOpen
              ? 'bg-[#F5EFE6] text-[#74191D] border-[#74191D]/40'
              : 'bg-[#FFFDF9] hover:bg-[#F5EFE6] text-[#786A61] border-[#DED2C5]'
          }`}
          title={isInspectorOpen ? 'Collapse evidence inspector' : 'Expand evidence inspector'}
        >
          {isInspectorOpen ? (
            <PanelRightClose className="w-3.5 h-3.5 text-[#74191D]" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Inspector</span>
        </button>
      </div>
    </header>
  );
};
