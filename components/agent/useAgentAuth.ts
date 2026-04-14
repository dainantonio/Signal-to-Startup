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

const ensureUserDocument = async (
  user: FirebaseUser
) => {
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
    }
  } catch (err) {
    console.warn(
      '[AUTH] Failed to create user doc:', err
    );
  }
};

export function useAgentAuth() {
  const [user, setUser] =
    useState<FirebaseUser | null>(null);
  const [loginError, setLoginError] =
    useState<string | null>(null);
  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    console.log(
      '[AUTH] useEffect mounting, currentUser:',
      auth.currentUser?.email || 'none'
    );

    // CRITICAL: handle redirect result on
    // mount — fires when user returns from
    // Google sign-in redirect
    getRedirectResult(auth)
      .then((result) => {
        console.log(
          '[AUTH] getRedirectResult called, result:',
          result ? 'HAS RESULT' : 'NULL'
        );
        if (result?.user) {
          console.log(
            '[AUTH] Redirect user:',
            result.user.email
          );
          ensureUserDocument(result.user);
        }
      })
      .catch((err: unknown) => {
        const code =
          (err as { code?: string }).code;
        if (
          code === 'auth/cancelled-popup-request'
          || code === 'auth/popup-closed-by-user'
          || code === 'auth/credential-already-in-use'
        ) return;
        console.error(
          '[AUTH] getRedirectResult error:', err
        );
      });

    // Auth state listener — fires for both
    // popup and redirect sign-in
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        console.log(
          '[AUTH] State change:',
          firebaseUser
            ? `SIGNED IN as ${firebaseUser.email}`
            : 'SIGNED OUT'
        );
        console.log(
          '[AUTH] Auth currentUser:',
          auth.currentUser?.email || 'none'
        );
        if (firebaseUser) {
          ensureUserDocument(firebaseUser);
          setUser(firebaseUser);
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoginError(null);
    try {
      // Use popup on all devices —
      // redirect causes COOP issues on mobile
      console.log('[AUTH] login() called');
      await signInWithPopup(auth, googleProvider);
      console.log('[AUTH] popup completed successfully');
    } catch (err: unknown) {
      const code =
        (err as { code?: string }).code;
      if (
        code === 'auth/cancelled-popup-request'
        || code === 'auth/popup-closed-by-user'
      ) return;

      // If popup blocked, fall back to redirect
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch {
          setLoginError('Sign-in failed. Please try again.');
        }
        return;
      }

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

  return {
    user,
    login,
    logout,
    loginError,
    authLoading,
  };
}
