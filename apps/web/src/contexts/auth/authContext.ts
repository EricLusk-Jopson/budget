import { type User } from "@budget/api";
import { createContext } from "react";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
