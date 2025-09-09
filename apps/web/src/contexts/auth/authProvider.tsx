import { authHelpers, type User } from "@budget/api";
import { type ReactNode, useState, useEffect } from "react";
import { type AuthContextType, AuthContext } from "./authContext";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authHelpers.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      console.log("Auth state changed:", user?.email || "No user");
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authHelpers.signIn(email, password);
    } catch (error) {
      console.log("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await authHelpers.createUser(email, password);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await authHelpers.signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authHelpers.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await authHelpers.sendPasswordResetEmail(email);
    } catch (error) {
      console.error("Password Reset Error:", error);
      throw error;
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      await authHelpers.confirmPasswordReset(oobCode, newPassword);
    } catch (error) {
      console.error("New Password Error: ", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    sendPasswordResetEmail,
    confirmPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
