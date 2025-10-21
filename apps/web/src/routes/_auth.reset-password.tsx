import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const { oobCode } = Route.useSearch();
  return (
    <div className="flex-1 flex justify-center px-8 mt-[12vh]">
      <ResetPasswordForm code={oobCode} />
    </div>
  );
}
