import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex justify-center px-8">
        <Outlet />
      </div>
      <div className="flex-1 bg-green-100">{/* hero image goes here */}</div>
    </div>
  );
}
