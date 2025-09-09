import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../contexts/auth/useAuth";
import { useEffect } from "react";

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectAuthenticatedTo?: string;
}

export const useAuthRedirect = ({
  requireAuth = true,
  redirectTo = "/login",
  redirectAuthenticatedTo = "/dashboard",
}: UseAuthRedirectOptions = {}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      // User needs to be authenticated but isn't
      router.navigate({ to: redirectTo });
    } else if (!requireAuth && user) {
      // User is authenticated but still shouldn't be on this page
      //   router.navigate({ to: redirectAuthenticatedTo });
    }
  }, [user, loading, requireAuth, redirectTo, redirectAuthenticatedTo, router]);

  return { user, loading };
};
