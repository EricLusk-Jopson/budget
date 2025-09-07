import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signIn")({
  component: SignIn,
});

function SignIn() {
  return <div className="p-2">Hello "/signIn"!</div>;
}
