'use client';

import { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        ensureUserDocument(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      // popup-closed-by-user and popup-blocked are expected user actions — don't show an error
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setLoginError('Sign-in failed. Please try again.');
        console.error('Login failed', err);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return { user, login, logout, loginError };
}
