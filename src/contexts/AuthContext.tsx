import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      toast.success('Successfully logged in!');
    } catch (err) {
      const errorMessage = 'Failed to login. Please check your credentials';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      setCurrentUser(userCredential.user);
      toast.success('Account created successfully!');
    } catch (err) {
      const errorMessage = 'Failed to create account';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setCurrentUser(result.user);
      toast.success('Successfully signed in with Google!');
    } catch (err) {
      const errorMessage = 'Failed to sign in with Google';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (err) {
      const errorMessage = 'Failed to send password reset email';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast.success('Successfully logged out!');
    } catch (err) {
      const errorMessage = 'Failed to logout';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    googleSignIn,
    error,
    clearError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}