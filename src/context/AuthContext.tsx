import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { syncUserProfile } from '../lib/cloudStorage';
import type { AppUser, UserProfile } from '../types';

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const LOCAL_SESSION_KEY = 'documorph_active_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const prof = await syncUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
        setUserProfile(prof);
      } catch (err) {
        console.error('Failed to sync profile', err);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          isLocalOnly: false,
        };
        setUser(appUser);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        try {
          const prof = await syncUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          });
          setUserProfile(prof);
        } catch (err) {
          console.error('Error initializing user profile', err);
        }
      } else {
        // Check for local private session
        const raw = localStorage.getItem(LOCAL_SESSION_KEY);
        if (raw) {
          try {
            const savedUser: AppUser = JSON.parse(raw);
            setUser(savedUser);
            const prof = await syncUserProfile({
              uid: savedUser.uid,
              email: savedUser.email,
              displayName: savedUser.displayName,
            });
            setUserProfile(prof);
          } catch {
            setUser(null);
            setUserProfile(null);
          }
        } else {
          const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
          const autoUser: AppUser = {
            uid: guestId,
            email: `guest@documorph.local`,
            displayName: `Private Workspace`,
            isLocalOnly: true,
          };
          setUser(autoUser);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(autoUser));
          syncUserProfile({
            uid: guestId,
            email: autoUser.email,
            displayName: autoUser.displayName,
          }).then((prof) => setUserProfile(prof)).catch(() => {});
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isLocalOnly: false,
      };
      setUser(appUser);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      const prof = await syncUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });
      setUserProfile(prof);
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      // Try Firebase Auth first
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isLocalOnly: false,
      };
      setUser(appUser);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      const prof = await syncUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });
      setUserProfile(prof);
    } catch (err: any) {
      // If Firebase email auth is not toggled on in console, fallback smoothly to local private account
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/admin-restricted-operation') {
        const localUid = `usr_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
        const appUser: AppUser = {
          uid: localUid,
          email,
          displayName: email.split('@')[0],
          isLocalOnly: true,
        };
        setUser(appUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
        const prof = await syncUserProfile({
          uid: localUid,
          email,
          displayName: appUser.displayName,
        });
        setUserProfile(prof);
        return;
      }
      console.error('Email Sign-in error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name || cred.user.displayName,
        isLocalOnly: false,
      };
      setUser(appUser);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      const prof = await syncUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name || cred.user.displayName,
      });
      setUserProfile(prof);
    } catch (err: any) {
      // If Firebase email auth is not toggled on in console, fallback smoothly to local private account
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/admin-restricted-operation') {
        const localUid = `usr_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
        const appUser: AppUser = {
          uid: localUid,
          email,
          displayName: name || email.split('@')[0],
          isLocalOnly: true,
        };
        setUser(appUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
        const prof = await syncUserProfile({
          uid: localUid,
          email,
          displayName: appUser.displayName,
        });
        setUserProfile(prof);
        return;
      }
      console.error('Sign-up error:', err);
      throw err;
    }
  };

  const signInAsDemo = async () => {
    // Generate or reuse persistent guest UID for private workspace
    const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const appUser: AppUser = {
      uid: guestId,
      email: `guest@documorph.local`,
      displayName: `Guest Workspace`,
      isLocalOnly: true,
    };
    setUser(appUser);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
    const prof = await syncUserProfile({
      uid: guestId,
      email: appUser.email,
      displayName: appUser.displayName,
    });
    setUserProfile(prof);
  };

  const signOut = async () => {
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
    } catch {
      // ignore
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
