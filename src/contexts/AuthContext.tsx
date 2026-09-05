import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut, onAuthStateChanged, FirebaseUser } from '../lib/firebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  allUsers: UserProfile[];
  updateUserRole: (userId: string, newRole: UserRole) => void;
  loginAsDemo: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  emailLogin: (email: string, pass: string) => Promise<void>;
  emailRegister: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default demo accounts for testing all roles instantly without requiring full Firebase project setup right away
const DEMO_USERS: Record<UserRole, UserProfile> = {
  Owner: {
    user_id: 'usr_owner_01',
    name: 'المالك / المدير العام (Owner)',
    email: 'owner@elites-store.com',
    phone: '+970599000000',
    role: 'Owner',
    status: 'active',
    created_at: new Date().toISOString()
  },
  Manager: {
    user_id: 'usr_mgr_01',
    name: 'مدير المتجر (Manager)',
    email: 'manager@elites-store.com',
    phone: '+970599111111',
    role: 'Manager',
    status: 'active',
    created_at: new Date().toISOString()
  },
  Accountant: {
    user_id: 'usr_acc_01',
    name: 'المحاسب المالي (Accountant)',
    email: 'accountant@elites-store.com',
    phone: '+970599222222',
    role: 'Accountant',
    status: 'active',
    created_at: new Date().toISOString()
  },
  Marketing: {
    user_id: 'usr_mkt_01',
    name: 'مسؤول التسويق (Marketing)',
    email: 'marketing@elites-store.com',
    phone: '+970599333333',
    role: 'Marketing',
    status: 'active',
    created_at: new Date().toISOString()
  },
  Employee: {
    user_id: 'usr_emp_01',
    name: 'موظف التجهيز (Employee)',
    email: 'employee@elites-store.com',
    phone: '+970599444444',
    role: 'Employee',
    status: 'active',
    created_at: new Date().toISOString()
  },
  Customer: {
    user_id: 'usr_cust_01',
    name: 'أحمد العميل (Customer)',
    email: 'customer@gmail.com',
    phone: '+970599555555',
    role: 'Customer',
    status: 'active',
    created_at: new Date().toISOString()
  }
};

// Helper to check if email is an Owner / Admin email
const isOwnerEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower === 'abuelmajd3@gmail.com' || lower.includes('owner') || lower.includes('admin') || lower === 'owner@elites-store.com';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('elites_current_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.Owner;
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('elites_all_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return Object.values(DEMO_USERS);
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const updated = allUsers.map(u => u.user_id === userId ? { ...u, role: newRole } : u);
    setAllUsers(updated);
    localStorage.setItem('elites_all_users', JSON.stringify(updated));
    if (currentUser && currentUser.user_id === userId) {
      const updatedCurr = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurr);
      localStorage.setItem('elites_current_user', JSON.stringify(updatedCurr));
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Map firebase user to UserProfile
        const role: UserRole = isOwnerEmail(user.email) ? 'Owner' : 'Customer';
        const profile: UserProfile = {
          user_id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'مستخدم',
          email: user.email || '',
          role,
          status: 'active',
          created_at: new Date().toISOString()
        };
        setCurrentUser(profile);
        localStorage.setItem('elites_current_user', JSON.stringify(profile));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginAsDemo = (role: UserRole) => {
    const user = DEMO_USERS[role];
    setCurrentUser(user);
    localStorage.setItem('elites_current_user', JSON.stringify(user));
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please configure VITE_FIREBASE_API_KEY in .env");
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const role: UserRole = isOwnerEmail(user.email) ? 'Owner' : 'Customer';
      const profile: UserProfile = {
        user_id: user.uid,
        name: user.displayName || 'مستخدم جوجل',
        email: user.email || '',
        role,
        status: 'active',
        created_at: new Date().toISOString()
      };
      setCurrentUser(profile);
      localStorage.setItem('elites_current_user', JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const emailLogin = async (email: string, pass: string) => {
    try {
      if (auth) {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const user = res.user;
        const role: UserRole = isOwnerEmail(user.email) ? 'Owner' : 'Customer';
        const profile: UserProfile = {
          user_id: user.uid,
          name: user.email?.split('@')[0] || 'مستخدم',
          email: user.email || '',
          role,
          status: 'active',
          created_at: new Date().toISOString()
        };
        setCurrentUser(profile);
        localStorage.setItem('elites_current_user', JSON.stringify(profile));
        return;
      }
    } catch (err) {
      console.warn("Firebase Auth login failed, using local session fallback:", err);
    }

    // Offline / fallback login for demo or when firebase auth is unconfigured/disabled
    const found = Object.values(DEMO_USERS).find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('elites_current_user', JSON.stringify(found));
      return;
    }
    // Create custom user if not found in demo users
    const role: UserRole = isOwnerEmail(email) ? 'Owner' : 'Customer';
    const customUser: UserProfile = {
      user_id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      role,
      status: 'active',
      created_at: new Date().toISOString()
    };
    setCurrentUser(customUser);
    localStorage.setItem('elites_current_user', JSON.stringify(customUser));
  };

  const emailRegister = async (email: string, pass: string, name: string, role: UserRole = 'Customer') => {
    try {
      if (auth) {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        const user = res.user;
        const profile: UserProfile = {
          user_id: user.uid,
          name,
          email,
          role,
          status: 'active',
          created_at: new Date().toISOString()
        };
        setCurrentUser(profile);
        localStorage.setItem('elites_current_user', JSON.stringify(profile));
        return;
      }
    } catch (err) {
      console.warn("Firebase Auth register failed, using local session fallback:", err);
    }

    const newUser: UserProfile = {
      user_id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      status: 'active',
      created_at: new Date().toISOString()
    };
    setCurrentUser(newUser);
    localStorage.setItem('elites_current_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('elites_current_user');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      firebaseUser,
      loading,
      role: currentUser?.role || null,
      allUsers,
      updateUserRole,
      loginAsDemo,
      signInWithGoogle,
      emailLogin,
      emailRegister,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
