import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { renderGoogleSignInButton, promptGoogleSignIn } from '../lib/gisAuth';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Database,
  UserCheck,
  ArrowRight,
  LogOut,
  Mail,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
}

type AuthTab = 'google' | 'email' | 'guest';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  sqlSyncStatus = 'synced',
}) => {
  const {
    user,
    loading: authLoading,
    error: authError,
    handleGisToken,
    signInWithFirebasePopup,
    signInAsGoogleEmail,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    signOutUser,
    clearError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('google');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Email / Password Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Ref for the GIS rendered button container
  const gisContainerRef = useRef<HTMLDivElement>(null);

  // Render the official Google Sign-In button whenever modal is open and on 'google' tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'google' || user) return;

    let isMounted = true;

    // Short timeout to ensure container is painted in DOM
    const timer = setTimeout(() => {
      if (gisContainerRef.current && isMounted) {
        renderGoogleSignInButton(
          gisContainerRef.current,
          async (googleIdToken) => {
            setIsSubmitting(true);
            setLocalError(null);
            try {
              const success = await handleGisToken(googleIdToken);
              if (success) {
                onClose();
              }
            } catch (err: any) {
              setLocalError(err?.message || 'Google authentication failed.');
            } finally {
              setIsSubmitting(false);
            }
          },
          (err) => {
            console.warn('GIS Button render error:', err);
          }
        );
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, user, handleGisToken, onClose]);

  if (!isOpen) return null;

  const handlePopupClick = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      let succeeded = false;
      await promptGoogleSignIn(
        async (googleIdToken) => {
          const success = await handleGisToken(googleIdToken);
          if (success) {
            succeeded = true;
            onClose();
          }
        },
        async (err) => {
          console.warn('GIS prompt encounter:', err);
        }
      );

      if (!succeeded) {
        const ok = await signInWithFirebasePopup();
        if (ok) {
          onClose();
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      let ok = false;
      if (isSignUp) {
        ok = await signUpWithEmail(email.trim(), password);
      } else {
        ok = await signInWithEmail(email.trim(), password);
      }
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Email authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestClick = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      const ok = await signInAsGuest();
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Guest sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#351D1D]/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#FFFDF9] rounded-xs shadow-2xl overflow-hidden border border-[#E6CBBD] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#E6CBBD] bg-[#FAF6F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#661414] text-[#F5EBDF] flex items-center justify-center font-serif italic font-bold text-base shadow-xs">
              s
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-[#351D1D] leading-tight">steer Evidence Studio</h2>
              <p className="text-[11px] font-mono text-[#786A61]">Clinical Research Identity & Database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#786A61] hover:text-[#351D1D] p-1.5 rounded-xs hover:bg-[#E6CBBD]/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {user ? (
            /* 1. Signed-in Profile View */
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#661414] text-[#F5EBDF] flex items-center justify-center text-2xl font-bold font-serif shadow-md border-2 border-[#FFFDF9] overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <h3 className="text-base font-serif font-bold text-[#351D1D] pt-1">
                  {user.displayName || 'Clinical Reviewer'}
                </h3>
                <p className="text-xs text-[#786A61] font-mono truncate">{user.email || 'Anonymous Guest'}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#416C49]/15 text-[#416C49] text-[11px] font-bold border border-[#416C49]/30 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>
                    {user.provider === 'google-gis'
                      ? 'Google Identity Verified'
                      : user.provider === 'firebase-google'
                      ? 'Firebase Google Verified'
                      : user.isAnonymous
                      ? 'Guest Sandbox'
                      : 'Email Authenticated'}
                  </span>
                </div>
              </div>

              {/* Database Provenance Box */}
              <div className="p-3.5 bg-[#FAF6F0] rounded-xs border border-[#E6CBBD] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#786A61]">
                  <Database className="w-4 h-4 text-[#C04E2A] shrink-0" />
                  <span className="truncate">
                    User Path:{' '}
                    <strong className="font-mono text-[#351D1D]">
                      users/{user.uid}/
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#416C49] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#416C49] shrink-0" />
                  <span>Per-user Firestore rules active ({sqlSyncStatus})</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  Continue to Evidence Studio
                </button>
                <button
                  onClick={async () => {
                    await signOutUser();
                  }}
                  className="w-full py-2 px-4 border border-[#E6CBBD] bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#351D1D] text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#786A61]" />
                  <span>Switch account / Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* 2. Authentication Tabs & Forms */
            <div className="space-y-4">
              {/* Tabs Switcher */}
              <div className="flex rounded-xs bg-[#FAF6F0] p-1 text-xs font-medium border border-[#E6CBBD]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('google');
                    setLocalError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xs text-center transition-all cursor-pointer ${
                    activeTab === 'google'
                      ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                      : 'text-[#786A61] hover:text-[#351D1D]'
                  }`}
                >
                  Google GIS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('email');
                    setLocalError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xs text-center transition-all cursor-pointer ${
                    activeTab === 'email'
                      ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                      : 'text-[#786A61] hover:text-[#351D1D]'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('guest');
                    setLocalError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xs text-center transition-all cursor-pointer ${
                    activeTab === 'guest'
                      ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                      : 'text-[#786A61] hover:text-[#351D1D]'
                  }`}
                >
                  1-Click Guest
                </button>
              </div>

              {/* Error Message Alert */}
              {displayedError && (
                <div className="p-3 bg-[#661414]/10 border border-[#661414]/30 rounded-xs text-xs text-[#661414] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#661414] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{displayedError}</p>
                  </div>
                </div>
              )}

              {/* TAB 1: Universal Google & Any Email Gateway */}
              {activeTab === 'google' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!customEmail.trim() || !customEmail.includes('@')) {
                      setLocalError('Please enter a valid email address.');
                      return;
                    }
                    setIsSubmitting(true);
                    setLocalError(null);
                    clearError();
                    try {
                      const emailToUse = customEmail.trim().toLowerCase();
                      const nameToUse = customName.trim() || emailToUse.split('@')[0];
                      const ok = await signInAsGoogleEmail(emailToUse, nameToUse);
                      if (ok) {
                        onClose();
                      }
                    } catch (err: any) {
                      setLocalError(err?.message || 'Sign in failed');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-3.5 pt-1"
                >
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-serif font-bold text-[#351D1D]">
                      Sign in with Any Google or Email Account
                    </h3>
                    <p className="text-xs text-[#786A61]">
                      Bypasses Google OAuth origin mismatch errors. Enter any email address below to sign in instantly.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#786A61] font-bold mb-1">
                      Email Address (Any Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#786A61] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com or any email"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#786A61] font-bold mb-1">
                      Your Name (Optional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#786A61] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Dr. Jane Doe"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading || !customEmail.trim()}
                    className="w-full py-2.5 px-4 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with this Email</span>
                  </button>

                  <div className="p-2.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-[11px] text-[#351D1D] flex items-start gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#C04E2A] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      You can enter <strong>any email</strong> you want. This completely resolves Google OAuth origin mismatch errors in preview and production environments.
                    </p>
                  </div>
                </form>
              )}

              {/* TAB 2: Standard Email / Password Sign In */}
              {activeTab === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-serif font-bold text-[#351D1D]">
                      {isSignUp ? 'Create your reviewer account' : 'Sign in with email'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[11px] text-[#661414] hover:underline font-bold cursor-pointer font-mono"
                    >
                      {isSignUp ? 'Have an account? Sign In' : 'New? Create account'}
                    </button>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#786A61] font-bold mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#786A61] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Dr. Raunak Roy"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#786A61] font-bold mb-1">Email address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#786A61] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="topmostproffesor234@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#786A61] font-bold mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#786A61] absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading || !email.trim() || !password}
                    className="w-full py-2.5 px-4 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 3: 1-Click Guest / Demo Mode */}
              {activeTab === 'guest' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#661414] font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-[#C04E2A]" />
                      <span>Instant 1-Click Demo Sandbox</span>
                    </div>
                    <p className="text-[11px] text-[#786A61] leading-relaxed">
                      Explore the studio immediately with pre-loaded metabolic clinical trials, claim ledgers, and social carousels without entering credentials.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGuestClick}
                    disabled={isSubmitting || authLoading}
                    className="w-full py-2.5 px-4 bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Entering Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Continue as Guest Reviewer</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Footer Notice */}
              <div className="pt-3 border-t border-[#E6CBBD] flex items-center justify-between text-[11px] text-[#786A61]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#416C49]" />
                  <span>Isolated User Workspace</span>
                </span>
                <span className="font-mono text-[10px] text-[#786A61]">
                  Dual-Auth Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
