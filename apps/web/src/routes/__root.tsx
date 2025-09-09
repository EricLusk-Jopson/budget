import { AuthProvider } from "@/contexts/auth/authProvider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
      <TanStackRouterDevtools />
    </AuthProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
