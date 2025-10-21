import { SignUpForm } from "@/components/auth/SignUpForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signup")({
  component: SignUp,
});

function SignUp() {
  return (
    <div className="flex-1 flex justify-center px-8 mt-[12vh]">
      <SignUpForm />
    </div>
  );
}
