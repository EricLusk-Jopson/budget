import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex justify-center px-8 mt-[12vh]">
        <ForgotPasswordForm />
      </div>
      <div className="flex-1 bg-green-100">{/* hero image goes here */}</div>
    </div>
  );
}
