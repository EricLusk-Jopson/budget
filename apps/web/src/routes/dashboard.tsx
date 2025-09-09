import { useAuth } from "@/contexts/auth/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuthRedirect({ requireAuth: true });
  if (loading) return <>Loading...</>;

  return <>Dashboard</>;
}
