import { SignUpForm } from "@/components/auth/SignUpForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signUp")({
  component: SignUp,
});

function SignUp() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex justify-center px-8 mt-[12vh]">
        <SignUpForm />
      </div>
      <div className="flex-1 bg-green-100">{/* hero image goes here */}</div>
    </div>
  );
}
