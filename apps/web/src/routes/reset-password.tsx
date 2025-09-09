import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const { oobCode } = Route.useSearch();
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-8">
        <ResetPasswordForm code={oobCode} />
      </div>
      <div className="flex-1 bg-green-100">
        {/* Same hero image as your other auth pages */}
      </div>
    </div>
  );
}
