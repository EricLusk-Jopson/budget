import { authHelpers, type User } from "@budget/api";
import { type ReactNode, useState, useEffect } from "react";
import { type AuthContextType, AuthContext } from "./authContext";
import { useLocation, useNavigate } from "@tanstack/react-router";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  const location = useLocation();
  const navigate = useNavigate(); // Use useNavigate instead of useRouter

  const authRoutes = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/pools",
    "/channels",
    "/reports",
  ];

  // Only handle auth state changes (no navigation)
  useEffect(() => {
    console.log("Setting up auth state listener...");

    const unsubscribe = authHelpers.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user?.email || "No user");
      setUser(user);
      setLoading(false);
      setInitialAuthCheckDone(true);
    });

    return () => {
      console.log("Cleaning up auth state listener...");
      unsubscribe();
    };
  }, []);

  // Handle navigation separately based on user + location
  useEffect(() => {
    // Don't navigate until we know the auth state
    if (!initialAuthCheckDone || loading) {
      console.log("Skipping navigation - initial auth check not complete");
      return;
    }

    const currentPath = location.pathname;
    console.log("Navigation effect running...");
    console.log("  User:", user?.email || "null");
    console.log("  Current path:", currentPath);
    console.log("  Is auth route:", authRoutes.includes(currentPath));

    if (user) {
      // User IS authenticated
      console.log("User is authenticated, checking if on auth route...");

      if (authRoutes.includes(currentPath)) {
        console.log("User is on auth route - navigating to dashboard");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      // If on home page, go to dashboard
      if (currentPath === "/" || currentPath === "") {
        console.log("User is on home - navigating to dashboard");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      console.log(
        "User authenticated and on valid route - no navigation needed"
      );
    } else {
      // User is NOT authenticated
      console.log(
        "User is NOT authenticated, checking if on protected route..."
      );

      if (protectedRoutes.some((route) => currentPath.startsWith(route))) {
        console.log("User on protected route - redirecting to signin");
        navigate({
          to: "/signin",
          search: { redirect: currentPath },
          replace: true,
        });
        return;
      }

      console.log(
        "User not authenticated but on public route - no navigation needed"
      );
    }
  }, [user, location.pathname, initialAuthCheckDone, loading, navigate]); // All dependencies

  const signIn = async (email: string, password: string) => {
    try {
      await authHelpers.signIn(email, password);
      // Navigation will be handled automatically by the effect above
    } catch (error) {
      console.log("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await authHelpers.createUser(email, password);
      // Navigation will be handled automatically by the effect above
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await authHelpers.signInWithGoogle();
      // Navigation will be handled automatically by the effect above
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authHelpers.signOut();
      // Navigation will be handled automatically by the effect above
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
