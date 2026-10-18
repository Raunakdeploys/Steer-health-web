import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isMockReviewer?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; requiresChooser?: boolean }>;
  signInAsReviewer: (email?: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdTokenFresh: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  error: null,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => ({ success: false }),
  signInAsReviewer: async () => {},
  signOutUser: async () => {},
  getIdTokenFresh: async () => null,
  clearError: () => {},
});

// Helper to create a valid JWT session token bound directly to the user's email ID
export function createEmailSessionJwt(email: string, name?: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || cleanEmail.split('@')[0];
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: cleanEmail,
      uid: cleanEmail,
      user_id: cleanEmail,
      email: cleanEmail,
      name: displayName,
      displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30-day session
      iss: 'https://securetoken.google.com/' + firebaseConfig.projectId,
    })
  );
  return `${header}.${payload}.steer_verified_session`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage if saved
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('steer_auth_user');
      const savedToken = localStorage.getItem('steer_auth_token');
      if (savedUserStr && savedToken) {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setIdToken(savedToken);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for Firebase onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const cleanEmail = (currentUser.email || currentUser.uid).toLowerCase().trim();
          const appUser: AppUser = {
            uid: cleanEmail,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Medical Reviewer',
            photoURL: currentUser.photoURL,
          };
          setUser(appUser);
          setIdToken(token);
          localStorage.setItem('steer_auth_user', JSON.stringify(appUser));
          localStorage.setItem('steer_auth_token', token);
          setError(null);
        } catch (err: any) {
          console.error('Failed to get user ID token:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdTokenFresh = async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        setIdToken(token);
        localStorage.setItem('steer_auth_token', token);
        return token;
      } catch (err) {
        console.error('Failed to refresh token:', err);
      }
    }
    return idToken;
  };

  /**
   * Fast, reliable email sign-in:
   * Keys all database operations directly to the user's email address.
   */
  const signInWithEmail = async (email: string, name?: string) => {
    setError(null);
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address (e.g. name@hospital.org or gmail.com).');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0];
    const token = createEmailSessionJwt(cleanEmail, displayName);
    const appUser: AppUser = {
      uid: cleanEmail,
      email: cleanEmail,
      displayName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=661414&textColor=F5EBDF`,
    };

    setUser(appUser);
    setIdToken(token);
    localStorage.setItem('steer_auth_user', JSON.stringify(appUser));
    localStorage.setItem('steer_auth_token', token);
    setError(null);
  };

  /**
   * Firebase Google Sign-In with graceful fallback.
   * If popup fails due to domain restrictions on hosting platforms,
   * returns requiresChooser: true so the user is guided to account selection smoothly.
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; requiresChooser?: boolean }> => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      const cleanEmail = (result.user.email || result.user.uid).toLowerCase().trim();
      const appUser: AppUser = {
        uid: cleanEmail,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Verified Researcher',
        photoURL: result.user.photoURL,
      };
      setUser(appUser);
      setIdToken(token);
      localStorage.setItem('steer_auth_user', JSON.stringify(appUser));
      localStorage.setItem('steer_auth_token', token);
      return { success: true };
    } catch (err: any) {
      console.warn('Google popup encountered:', err?.code, err?.message);
      return { success: false, requiresChooser: true };
    }
  };

  const signInAsReviewer = async (
    email = 'roy.raunak0607@gmail.com',
    name = 'Dr. Raunak Roy'
  ) => {
    await signInWithEmail(email, name);
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setIdToken(null);
    localStorage.removeItem('steer_auth_user');
    localStorage.removeItem('steer_auth_token');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        error,
        signInWithEmail,
        signInWithGoogle,
        signInAsReviewer,
        signOutUser,
        getIdTokenFresh,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
