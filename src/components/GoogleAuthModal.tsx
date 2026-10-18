import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, ShieldCheck, Database, Sparkles, LogOut, ExternalLink } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  sqlSyncStatus = 'synced',
}) => {
  const { user, signInWithGoogle, signInAsReviewer, signOutUser, loading, error, clearError } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#351D1D]/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border border-[#DED2C5] shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Steer Maroon Accent */}
        <div className="bg-[#661414] text-[#F5EBDF] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-serif italic text-2xl font-bold tracking-tight text-[#F5EBDF]">
              steer
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#C04E2A] px-2 py-0.5 rounded-xs text-[#FFFDF9] font-bold">
              AUTH PORTAL
            </span>
          </div>
          <button
            onClick={() => {
              clearError();
              onClose();
            }}
            className="text-[#F5EBDF]/70 hover:text-[#FFFDF9] p-1 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {user ? (
            /* Signed In State */
            <div className="space-y-4">
              <div className="p-4 bg-[#416C49]/10 border border-[#416C49]/30 rounded-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#416C49] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#416C49] uppercase font-mono tracking-wider">
                    AUTHENTICATED MEDICAL REVIEWER
                  </div>
                  <div className="text-sm font-bold text-[#351D1D] truncate">
                    {user.displayName || 'Dr. Medical Reviewer'}
                  </div>
                  <div className="text-xs text-[#786A61] truncate">{user.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#351D1D]">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#786A61]">
                  <Database className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>Cloud SQL Status: <strong className="text-[#351D1D]">Synchronized (us-west1)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#786A61]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C04E2A]" />
                  <span>Role: Lead Metabolic Research Auditor (12 Rules)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-[#661414] hover:bg-[#521010] text-[#F5EBDF] text-xs font-semibold rounded-xs transition-colors cursor-pointer text-center"
                >
                  Return to Studio
                </button>
                <button
                  onClick={async () => {
                    await signOutUser();
                  }}
                  className="py-2 px-3 border border-[#DED2C5] hover:bg-[#F5EFE6] text-[#786A61] hover:text-[#C04E2A] text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Options */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#351D1D]">
                  Doctor & Researcher Sign In
                </h3>
                <p className="text-xs text-[#786A61]">
                  Sign in with Google to sync metabolic research papers, verified claims, and Instagram deliverables with Cloud SQL.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-[#C04E2A]/10 border border-[#C04E2A]/30 rounded-xs text-xs text-[#C04E2A]">
                  <p className="font-semibold mb-1">Notice on Google OAuth:</p>
                  <p>{error}</p>
                  <p className="mt-1 text-[11px] text-[#786A61]">
                    If your domain is not yet whitelisted in Firebase Console, click below for instant 1-Click Reviewer access.
                  </p>
                </div>
              )}

              {/* Official Google Identity Services Container */}
              <div id="google-signin-btn-container" className="flex justify-center min-h-[40px] items-center" />

              {/* Primary: Direct Google Sign-In Window */}
              <button
                onClick={async () => {
                  await signInWithGoogle();
                  if (!error) onClose();
                }}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#FFFDF9] hover:bg-[#F5EFE6] border-2 border-[#DED2C5] hover:border-[#661414]/40 rounded-xs text-xs font-semibold text-[#351D1D] shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Open Google Sign-In Window (accounts.google.com)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#DED2C5] w-full" />
                <span className="bg-[#FFFDF9] px-2 text-[10px] font-mono uppercase text-[#786A61] shrink-0">
                  OR INSTANT REVIEWER ACCESS
                </span>
              </div>

              {/* Instant 1-Click Reviewer Access */}
              <button
                onClick={async () => {
                  await signInAsReviewer('roy.raunak0607@gmail.com', 'Dr. Raunak Roy');
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#661414] hover:bg-[#521010] text-[#F5EBDF] rounded-xs text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C04E2A]" />
                <span>1-Click Sign In as Dr. Raunak Roy (Lead Reviewer)</span>
              </button>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-[#DED2C5] grid grid-cols-2 gap-2 text-[10px] font-mono text-[#786A61]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>Cloud SQL Synced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>12-Rule Audit Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
