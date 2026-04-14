'use client';

import { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  setDoc,
  getDoc,
} from '../../firebase';

const ensureUserDocument = async (user: FirebaseUser) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      });
      console.log('[AUTH] User document created:', user.uid);
    }
  } catch (err) {
    console.warn('[AUTH] Failed to create user doc:', err);
  }
};

export function useAgentAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result first — fires when user returns from Google redirect on mobile
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[AUTH] Redirect sign-in successful');
          ensureUserDocument(result.user);
        }
      })
      .catch((err: unknown) => {
        const code = (err as { code?: string }).code;
        if (
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/credential-already-in-use'
        ) return;
        console.warn('[AUTH] Redirect result error:', code);
      });

    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        ensureUserDocument(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoginError(null);
    try {
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) return;
      setLoginError('Sign-in failed. Please try again.');
      console.error('[AUTH] Login failed:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('[AUTH] Logout failed:', err);
    }
  };

  return { user, login, logout, loginError, authLoading };
}
