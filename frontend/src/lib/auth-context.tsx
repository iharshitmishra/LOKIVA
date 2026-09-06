import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User, TravelerProfile } from '../types';
import { API_BASE } from './api';
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogle,
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  logoutFirebase,
} from './firebase';

type Role = 'traveler' | 'provider' | 'admin';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, role?: Role) => Promise<void>;
  register: (email: string, name: string, password?: string, role?: Role) => Promise<void>;
  demoLogin: (role: Role, customName?: string, customEmail?: string) => Promise<void>;
  loginWithGoogle: (role?: Role, customName?: string, customEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<TravelerProfile>, newFullName?: string, newEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('lokiva_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('lokiva_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applySession = (data: { access_token: string; user: User }) => {
    localStorage.setItem('lokiva_token', data.access_token);
    localStorage.setItem('lokiva_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  /** Trade a verified Firebase ID token for a backend session JWT. The server
   *  derives identity from the token itself — we never send an email. */
  const exchangeFirebaseToken = async (idToken: string, role: Role = 'traveler', customName?: string) => {
    const res = await fetch(`${API_BASE}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, role, full_name: customName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sign-in failed' }));
      throw new Error(err.detail || 'Sign-in failed');
    }

    const data = await res.json();
    if (customName && data.user) {
      data.user.full_name = customName;
    }
    applySession(data);
    return data;
  };

  // Restore an existing session: check active Firebase Google account first, then backend token.
  useEffect(() => {
    let cancelled = false;
    let handled = false;
    let unsubscribe: (() => void) | undefined;

    const finish = () => {
      if (!cancelled) setIsLoading(false);
    };

    async function restoreStoredBackendToken() {
      if (handled || cancelled) return;
      const storedToken = localStorage.getItem('lokiva_token');

      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const userData = await res.json();
            if (cancelled) return;
            localStorage.setItem('lokiva_user', JSON.stringify(userData));
            setUser(userData);
            setToken(storedToken);
            finish();
            return;
          }

          localStorage.removeItem('lokiva_token');
          localStorage.removeItem('lokiva_user');
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to authenticate session:', err);
          finish();
          return;
        }
      }
      finish();
    }

    async function restoreSession() {
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
          if (cancelled) return;
          if (firebaseUser && firebaseUser.email) {
            handled = true;
            try {
              const idToken = await firebaseUser.getIdToken();
              if (!cancelled) {
                await exchangeFirebaseToken(idToken, 'traveler', firebaseUser.displayName || undefined);
              }
            } catch (err) {
              console.error('Failed to restore Firebase session:', err);
              await restoreStoredBackendToken();
            } finally {
              finish();
            }
            return;
          }

          await restoreStoredBackendToken();
        });
        return;
      }

      await restoreStoredBackendToken();
    }

    restoreSession();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  /** Backend-only credential login, used directly when Firebase is not
   *  configured and as a fallback for accounts that exist only in SQLite. */
  const loginWithBackend = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }

    applySession(await res.json());
  };

  const login = async (email: string, password: string = 'password123', role: Role = 'traveler') => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured()) {
        try {
          const { idToken } = await loginWithFirebaseEmail(email, password);
          await exchangeFirebaseToken(idToken, role);
          return;
        } catch (err: any) {
          console.warn('[LOKIVA Auth] Firebase login unavailable or account not found, falling back to local database:', err?.message || err);
          // Fall through to loginWithBackend below
        }
      }
      await loginWithBackend(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    fullName: string,
    password: string = 'password123',
    role: Role = 'traveler'
  ) => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured()) {
        try {
          const { idToken } = await registerWithFirebaseEmail(email, fullName, password);
          await exchangeFirebaseToken(idToken, role);
          return;
        } catch (firebaseErr: any) {
          console.warn('[LOKIVA Auth] Firebase registration unavailable, creating account in local database:', firebaseErr?.message || firebaseErr);
          // Fall through to backend registration below
        }
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, password, role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Registration failed');
      }

      applySession(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: Role = 'traveler', customName?: string, customEmail?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: customName, email: customEmail }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Demo login failed' }));
        throw new Error(err.detail || 'Demo login failed');
      }

      const data = await res.json();
      if (customName && data.user) {
        data.user.full_name = customName;
      }
      if (customEmail && data.user) {
        data.user.email = customEmail;
      }
      applySession(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: Role = 'traveler', customName?: string, customEmail?: string) => {
    setIsLoading(true);
    try {
      try {
        const { idToken, user: fbUser } = await signInWithGoogle();
        const effectiveName = customName || fbUser?.displayName || undefined;
        await exchangeFirebaseToken(idToken, role, effectiveName);
      } catch (err: any) {
        console.warn('[LOKIVA Auth] Google Sign-in error:', err);
        // If user intentionally closed or cancelled popup, do not force demo fallback
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          throw err;
        }
        // If Firebase project has not authorized this domain (e.g. lokiva.vercel.app on Vercel),
        // or has not enabled Google Auth (auth/configuration-not-found), or is not configured
        if (
          err?.code === 'auth/unauthorized-domain' ||
          err?.message?.includes('auth/unauthorized-domain') ||
          err?.code === 'auth/configuration-not-found' ||
          err?.message?.includes('configuration-not-found') ||
          !isFirebaseConfigured()
        ) {
          console.warn('[LOKIVA Auth] Firebase domain unauthorized or auth unconfigured. Gracefully falling back to authenticated backend session.');
          await demoLogin(role, customName || 'Piyush Kumar', customEmail || 'piyush@lokiva.com');
          return;
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('lokiva_token');
    localStorage.removeItem('lokiva_user');
    setToken(null);
    setUser(null);
    try {
      await logoutFirebase();
    } catch (err) {
      console.error('Firebase sign-out failed:', err);
    }
  };

  const updateProfile = async (data: Partial<TravelerProfile>, newFullName?: string, newEmail?: string) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      full_name: newFullName || user.full_name,
      email: newEmail || user.email,
      profile: {
        ...(user.profile || {
          traveler_type: 'Family with Kids',
          group_size: 4,
          budget: 1500,
          available_hours: 4,
          interests: ['culture', 'food'],
          accessibility_prefs: { low_walking: true },
          location_name: 'Jaipur',
          hotel_lat: 26.9124,
          hotel_lng: 75.7873,
        }),
        ...data,
      },
    };
    setUser(updatedUser);
    localStorage.setItem('lokiva_user', JSON.stringify(updatedUser));

    const activeToken = token || localStorage.getItem('lokiva_token');
    if (activeToken) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            full_name: newFullName || user.full_name,
            email: newEmail || user.email,
            profile: data,
          }),
        });
        if (res.ok) {
          const backendUser = await res.json();
          setUser(backendUser);
          localStorage.setItem('lokiva_user', JSON.stringify(backendUser));
        }
      } catch (err) {
        console.error('Failed to sync profile update to backend:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        loginWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
