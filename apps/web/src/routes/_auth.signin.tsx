import { SignInForm } from "@/components/auth/SignInForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signin")({
  component: SignIn,
});

function SignIn() {
  return (
    <div className="flex-1 flex justify-center px-8 mt-[12vh]">
      <SignInForm />
    </div>
  );
}
