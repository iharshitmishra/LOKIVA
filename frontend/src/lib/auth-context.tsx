import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  loginWithGoogle: (role?: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<TravelerProfile>,
    newFullName?: string,
    newEmail?: string,
    newAvatar?: string,
    newRole?: Role
  ) => Promise<void>;
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

  const exchangeFirebaseToken = async (idToken: string, role: Role = 'traveler', customName?: string) => {
    const res = await fetch(`${API_BASE}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, role, full_name: customName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sign-in token exchange failed' }));
      throw new Error(err.detail || 'Sign-in token exchange failed');
    }

    const data = await res.json();
    if (customName && data.user) {
      data.user.full_name = customName;
    }
    applySession(data);
    return data;
  };

  // Listen to Firebase Auth state change and synchronize user profile
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const finish = () => {
      if (!cancelled) setIsLoading(false);
    };

    async function restoreBackendSession() {
      const storedToken = localStorage.getItem('lokiva_token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const userData = await res.json();
            if (!cancelled) {
              setUser(userData);
              setToken(storedToken);
            }
            finish();
            return;
          }
        } catch {
          // Backend offline or unreachable
        }
      }
      finish();
    }

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (cancelled) return;

        if (fbUser && fbUser.email) {
          try {
            const idToken = await fbUser.getIdToken();
            const storedUserRaw = localStorage.getItem('lokiva_user');
            let detectedRole: Role = 'traveler';
            if (storedUserRaw) {
              try {
                const parsed = JSON.parse(storedUserRaw);
                if (parsed.role) detectedRole = parsed.role;
              } catch {}
            }

            const realUser: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              full_name: fbUser.displayName || fbUser.email.split('@')[0] || (detectedRole === 'provider' ? 'Cultural Host' : 'Traveler'),
              avatar: fbUser.photoURL || undefined,
              avatar_url: fbUser.photoURL || undefined,
              role: detectedRole,
              is_active: true,
              created_at: new Date().toISOString(),
              profile: {
                traveler_type: 'Cultural Explorer',
                group_size: 2,
                budget: 25000,
                available_hours: 6,
                interests: ['culture', 'heritage', 'food'],
                accessibility_prefs: { low_walking: false },
                location_name: 'Jaipur',
                hotel_lat: 26.9124,
                hotel_lng: 75.7873,
              },
            };

            // Attempt backend synchronization
            try {
              await exchangeFirebaseToken(idToken, detectedRole, fbUser.displayName || undefined);
            } catch {
              // Direct Firebase session
              if (!cancelled) {
                applySession({ access_token: idToken, user: realUser });
              }
            }
          } catch (err) {
            console.error('Failed to initialize Firebase user session:', err);
          } finally {
            finish();
          }
        } else {
          // Unauthenticated or signed out
          await restoreBackendSession();
        }
      });
    } else {
      restoreBackendSession();
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password: string = 'password123', role: Role = 'traveler') => {
    setIsLoading(true);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setIsLoading(false);
      throw new Error('Email is required');
    }

    try {
      if (isFirebaseConfigured()) {
        const { idToken, user: fbUser } = await loginWithFirebaseEmail(cleanEmail, password);
        const authenticatedUser: User = {
          id: fbUser.uid,
          email: fbUser.email || cleanEmail,
          full_name: fbUser.displayName || cleanEmail.split('@')[0] || (role === 'provider' ? 'Artisan Host' : 'Traveler'),
          avatar: fbUser.photoURL || undefined,
          avatar_url: fbUser.photoURL || undefined,
          role: role,
          is_active: true,
          created_at: new Date().toISOString(),
        };

        try {
          await exchangeFirebaseToken(idToken, role);
        } catch (exchangeErr) {
          console.warn('[LOKIVA Auth] Backend sync skipped, applying direct Firebase user:', exchangeErr);
          applySession({ access_token: idToken, user: authenticatedUser });
        }
        return;
      }

      // Backend API login
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
        throw new Error(errData.detail || 'Invalid email or password');
      }

      applySession(await res.json());
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
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
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    if (!cleanEmail || !cleanName) {
      setIsLoading(false);
      throw new Error('Email and Full Name are required');
    }

    try {
      if (isFirebaseConfigured()) {
        const { idToken, user: fbUser } = await registerWithFirebaseEmail(cleanEmail, cleanName, password);
        const authenticatedUser: User = {
          id: fbUser.uid,
          email: fbUser.email || cleanEmail,
          full_name: cleanName || fbUser.displayName || cleanEmail.split('@')[0],
          avatar: fbUser.photoURL || undefined,
          avatar_url: fbUser.photoURL || undefined,
          role: role,
          is_active: true,
          created_at: new Date().toISOString(),
        };

        try {
          await exchangeFirebaseToken(idToken, role, cleanName);
        } catch (exchangeErr) {
          console.warn('[LOKIVA Auth] Backend sync skipped, applying direct Firebase user:', exchangeErr);
          applySession({ access_token: idToken, user: authenticatedUser });
        }
        return;
      }

      // Backend API register
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, full_name: cleanName, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errData.detail || 'Registration failed');
      }

      applySession(await res.json());
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: Role = 'traveler') => {
    setIsLoading(true);
    try {
      const { idToken, user: fbUser } = await signInWithGoogle();
      const authenticatedUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        full_name: fbUser.displayName || fbUser.email?.split('@')[0] || (role === 'provider' ? 'Artisan Host' : 'Traveler'),
        avatar: fbUser.photoURL || undefined,
        avatar_url: fbUser.photoURL || undefined,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        profile: {
          traveler_type: 'Cultural Explorer',
          group_size: 2,
          budget: 25000,
          available_hours: 6,
          interests: ['culture', 'heritage', 'food'],
          accessibility_prefs: { low_walking: false },
          location_name: 'Jaipur',
          hotel_lat: 26.9124,
          hotel_lng: 75.7873,
        },
      };

      try {
        await exchangeFirebaseToken(idToken, role, authenticatedUser.full_name);
      } catch (exchangeErr) {
        console.warn('[LOKIVA Auth] Backend token exchange skipped/offline, using direct Firebase user session:', exchangeErr);
        applySession({
          access_token: idToken,
          user: authenticatedUser,
        });
      }
    } catch (error: any) {
      console.error('Firebase Google Sign-In Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: Role = 'traveler', customName?: string, customEmail?: string) => {
    setIsLoading(true);
    const targetName = customName && customName.trim() ? customName.trim() : (role === 'traveler' ? 'Demo Traveler' : 'Demo Host');
    const targetEmail = customEmail && customEmail.trim() ? customEmail.trim() : (role === 'traveler' ? 'traveler@lokiva.com' : 'provider@lokiva.com');

    try {
      try {
        const res = await fetch(`${API_BASE}/auth/demo-login/${role}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: targetName, email: targetEmail }),
        });

        if (res.ok) {
          const data = await res.json();
          if (targetName && data.user) {
            data.user.full_name = targetName;
          }
          if (targetEmail && data.user) {
            data.user.email = targetEmail;
          }
          applySession(data);
          return;
        }
      } catch (netErr) {
        console.warn('[LOKIVA Auth] Backend demo-login unreachable, activating local demo session:', netErr);
      }

      // Local demo fallback
      const demoUser: User = {
        id: Date.now(),
        email: targetEmail,
        full_name: targetName,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        profile: {
          traveler_type: 'Cultural Explorer',
          group_size: 2,
          budget: 25000,
          available_hours: 6,
          interests: ['culture', 'heritage', 'food'],
          accessibility_prefs: { low_walking: false },
          location_name: 'Jaipur',
          hotel_lat: 26.9124,
          hotel_lng: 75.7873,
        },
      };
      applySession({ access_token: `lokiva_demo_${Date.now()}`, user: demoUser });
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

  const updateProfile = async (
    data: Partial<TravelerProfile>,
    newFullName?: string,
    newEmail?: string,
    newAvatar?: string,
    newRole?: Role
  ) => {
    if (!user) return;
    const effectiveAvatar = newAvatar !== undefined ? newAvatar : user.avatar;
    const effectiveRole = newRole || user.role;
    const updatedUser: User = {
      ...user,
      full_name: newFullName || user.full_name,
      email: newEmail || user.email,
      role: effectiveRole,
      avatar: effectiveAvatar,
      avatar_url: effectiveAvatar,
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
        avatar: effectiveAvatar,
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
            role: effectiveRole,
            avatar: effectiveAvatar,
            profile: data,
          }),
        });
        if (res.ok) {
          const backendUser = await res.json();
          const mergedUser = { ...updatedUser, ...backendUser, avatar: effectiveAvatar || backendUser.avatar };
          setUser(mergedUser);
          localStorage.setItem('lokiva_user', JSON.stringify(mergedUser));
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
