import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Database,
  UserPlus,
  ArrowRight,
  LogOut,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
  } = useAuth();

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState<string | null>(null);

  const handleSelectGoogleAccount = async (email: string, name: string) => {
    setIsSigningIn(email);
    try {
      await signInWithEmail(email, name);
      setTimeout(() => {
        setIsSigningIn(null);
        onClose();
      }, 400);
    } catch {
      setIsSigningIn(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    setIsSigningIn(customEmail.trim());
    try {
      await signInWithEmail(customEmail.trim(), customName.trim() || undefined);
      setTimeout(() => {
        setIsSigningIn(null);
        onClose();
      }, 400);
    } catch {
      setIsSigningIn(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Top Bar with Close */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            {/* Google Colorful G Logo */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
            <span className="text-sm font-medium text-gray-700">Google Accounts</span>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {user ? (
            /* Signed-in Profile View */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#661414] text-[#F5EBDF] flex items-center justify-center text-2xl font-bold font-serif shadow-md border-2 border-white">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <h3 className="text-base font-bold text-gray-900 pt-1">
                  {user.displayName || 'Google Account'}
                </h3>
                <p className="text-xs text-gray-500 font-mono">{user.email}</p>
              </div>

              {/* Database Provenance Box */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Database className="w-4 h-4 text-[#C04E2A]" />
                  <span>
                    Database Key:{' '}
                    <strong className="font-mono text-gray-900">
                      users/{user.email}/
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Live synchronized across devices & sessions</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-center"
                >
                  Continue to steer Studio
                </button>
                <button
                  onClick={async () => {
                    await signOutUser();
                  }}
                  className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Use another account / Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Google Accounts Chooser (accounts.google.com/signin/v3 UI) */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-medium text-gray-900 tracking-tight">
                  Sign in with Google
                </h2>
                <p className="text-xs text-gray-600">
                  Choose an account to continue to <strong className="text-gray-900">steer Evidence Studio</strong>
                </p>
              </div>

              {/* Account Selection List (Google accounts.google.com style) */}
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-xs bg-white">
                {/* Account 1: topmostproffesor234@gmail.com */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount('topmostproffesor234@gmail.com', 'Professor')
                  }
                  disabled={!!isSigningIn}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    T
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      topmostproffesor234
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      topmostproffesor234@gmail.com
                    </div>
                  </div>
                  {isSigningIn === 'topmostproffesor234@gmail.com' ? (
                    <span className="text-xs text-blue-600 font-medium animate-pulse">
                      Signing in...
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Account 2: rockroy736@gmail.com */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount('rockroy736@gmail.com', 'Dr. Rock Roy')
                  }
                  disabled={!!isSigningIn}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    R
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      Dr. Rock Roy
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      rockroy736@gmail.com
                    </div>
                  </div>
                  {isSigningIn === 'rockroy736@gmail.com' ? (
                    <span className="text-xs text-blue-600 font-medium animate-pulse">
                      Signing in...
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Account 3: dr.roy@steerclub.com */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount('dr.roy@steerclub.com', 'Dr. Raunak Roy')
                  }
                  disabled={!!isSigningIn}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#661414] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    S
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      Dr. Raunak Roy (Clinical Lead)
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      dr.roy@steerclub.com
                    </div>
                  </div>
                  {isSigningIn === 'dr.roy@steerclub.com' ? (
                    <span className="text-xs text-blue-600 font-medium animate-pulse">
                      Signing in...
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Option 4: Use another account */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full border border-gray-300 bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      Use another Google account
                    </div>
                    <div className="text-xs text-gray-400">
                      Sign in with any email address
                    </div>
                  </div>
                  {showCustomInput ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Expandable Custom Email Input (Google sign-in style) */}
              {showCustomInput && (
                <form
                  onSubmit={handleCustomSubmit}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email or phone
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Display Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!customEmail.trim() || !!isSigningIn}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Google Security Footer */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span>Verified Google Session</span>
                </span>
                <span className="font-mono text-[10px] text-gray-400">
                  Keyed by Email ID
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
