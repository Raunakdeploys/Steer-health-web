import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Database,
  Mail,
  ArrowRight,
  LogOut,
  UserCheck,
  Sparkles,
} from 'lucide-react';

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
  const {
    user,
    signInWithEmail,
    signInWithGoogle,
    signOutUser,
    loading,
    error,
    clearError,
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      setLocalMessage('Please provide an email address.');
      return;
    }
    setIsSubmitting(true);
    setLocalMessage(null);
    try {
      await signInWithEmail(inputEmail.trim(), inputName.trim() || undefined);
      onClose();
    } catch (err: any) {
      setLocalMessage(err?.message || 'Failed to sign in with email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSignIn = async (email: string, name: string) => {
    setIsSubmitting(true);
    setLocalMessage(null);
    try {
      await signInWithEmail(email, name);
      onClose();
    } catch (err: any) {
      setLocalMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#351D1D]/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] border border-[#DED2C5] shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#661414] text-[#F5EBDF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-serif italic text-2xl font-bold tracking-tight text-[#F5EBDF]">
              steer
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#C04E2A] px-2 py-0.5 rounded-xs text-[#FFFDF9] font-bold">
              PORTAL LOGIN
            </span>
          </div>
          <button
            onClick={() => {
              clearError();
              setLocalMessage(null);
              onClose();
            }}
            className="text-[#F5EBDF]/70 hover:text-[#FFFDF9] p-1 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {user ? (
            /* Signed In State */
            <div className="space-y-4">
              <div className="p-4 bg-[#416C49]/10 border border-[#416C49]/30 rounded-xs flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#416C49] shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-semibold text-[#416C49] uppercase font-mono tracking-wider">
                    AUTHENTICATED RESEARCHER / DOCTOR
                  </div>
                  <div className="text-sm font-bold text-[#351D1D] truncate">
                    {user.displayName || 'Medical Researcher'}
                  </div>
                  <div className="text-xs text-[#786A61] font-mono font-medium truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Database Storage Provenance Info */}
              <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs space-y-2 text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px] text-[#786A61]">
                  <Database className="w-4 h-4 text-[#C04E2A]" />
                  <span>
                    Database Key:{' '}
                    <strong className="text-[#351D1D] font-bold">
                      users/{user.email}/
                    </strong>
                  </span>
                </div>
                <p className="text-[11px] text-[#786A61] leading-relaxed">
                  All scientific papers, extracted quotes, approved claims, and Instagram deliverables are persisted under your email ID across devices.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-[#416C49]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cloud Database Synchronized ({sqlSyncStatus})</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-[#661414] hover:bg-[#521010] text-[#F5EBDF] text-xs font-semibold rounded-xs transition-colors cursor-pointer text-center"
                >
                  Continue to Evidence Studio
                </button>
                <button
                  onClick={async () => {
                    await signOutUser();
                  }}
                  className="py-2.5 px-4 border border-[#DED2C5] hover:bg-[#F5EFE6] text-[#786A61] hover:text-[#C04E2A] text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Options */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#351D1D]">
                  Sign In with Your Email ID
                </h3>
                <p className="text-xs text-[#786A61] max-w-sm mx-auto">
                  Enter your email to instantly access your metabolic research papers, claims, and deliverables saved in the database.
                </p>
              </div>

              {(error || localMessage) && (
                <div className="p-3 bg-[#C04E2A]/10 border border-[#C04E2A]/30 rounded-xs text-xs text-[#C04E2A] space-y-1">
                  <p className="font-semibold">{error || localMessage}</p>
                </div>
              )}

              {/* Direct Email Sign-In Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 bg-[#F8F2EB] p-4 border border-[#E6CBBD] rounded-xs">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#661414] mb-1">
                    Your Email Address (Primary Database Key)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#786A61] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="e.g. topmostproffesor234@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#FFFDF9] border border-[#DED2C5] rounded-xs text-xs text-[#351D1D] focus:outline-hidden focus:border-[#661414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#786A61] mb-1">
                    Doctor / Researcher Name <span className="text-[10px] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. Dr. Raunak Roy"
                    className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DED2C5] rounded-xs text-xs text-[#351D1D] focus:outline-hidden focus:border-[#661414]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inputEmail.trim()}
                  className="w-full py-2.5 px-4 bg-[#661414] hover:bg-[#521010] text-[#F5EBDF] rounded-xs text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  <UserCheck className="w-4 h-4 text-[#F5EBDF]" />
                  <span>Sign In & Sync by Email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick 1-Click Select Options */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold text-center">
                  Quick 1-Click Access for Active Accounts
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('topmostproffesor234@gmail.com', 'Professor')}
                    className="w-full px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-left flex items-center justify-between cursor-pointer transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#416C49]" />
                      <span className="font-mono font-semibold text-[#351D1D] truncate">
                        topmostproffesor234@gmail.com
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#C04E2A] group-hover:underline shrink-0">
                      Sign in &rarr;
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('rockroy736@gmail.com', 'Dr. Rock Roy')}
                    className="w-full px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-left flex items-center justify-between cursor-pointer transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#416C49]" />
                      <span className="font-mono font-semibold text-[#351D1D] truncate">
                        rockroy736@gmail.com
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#C04E2A] group-hover:underline shrink-0">
                      Sign in &rarr;
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSignIn('dr.roy@steerclub.com', 'Dr. Raunak Roy')}
                    className="w-full px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-left flex items-center justify-between cursor-pointer transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#661414]" />
                      <span className="font-mono font-semibold text-[#351D1D] truncate">
                        dr.roy@steerclub.com (Clinical Lead)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#C04E2A] group-hover:underline shrink-0">
                      Sign in &rarr;
                    </span>
                  </button>
                </div>
              </div>

              {/* Or Google Sign-In */}
              <div className="pt-2 border-t border-[#DED2C5] space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    await signInWithGoogle();
                  }}
                  disabled={loading || isSubmitting}
                  className="w-full py-2 px-4 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#DED2C5] rounded-xs text-xs font-medium text-[#351D1D] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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
                  <span>Sign In with Google (Firebase)</span>
                </button>
              </div>

              {/* Security & Provenance Footer */}
              <div className="pt-2 border-t border-[#DED2C5] flex items-center justify-between text-[10px] font-mono text-[#786A61]">
                <div className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>Keyed by Email ID</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
                  <span>No Origin Restrictions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
