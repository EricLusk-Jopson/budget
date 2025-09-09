import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuthRedirect({ requireAuth: true });
  if (loading) return <>Loading...</>;

  return (
    <>
      Welcome {user?.displayName}, {user?.email}
    </>
  );
}
