import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <div className="flex-1 flex justify-center px-8 mt-[12vh]">
      <ForgotPasswordForm />
    </div>
  );
}
