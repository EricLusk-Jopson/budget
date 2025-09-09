import React, { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  AuthForm,
  AuthFormWrapper,
  AuthHelperLink,
  AuthInput,
  AuthSubmitButton,
  ErrorText,
} from "./utility";

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // run the password request and redirect to login page
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormWrapper>
      <AuthForm onSubmit={handleSubmit}>
        <div>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <AuthSubmitButton loading={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </AuthSubmitButton>
      </AuthForm>

      <p className="text-center text-gray-600 mt-4">
        Don't have an account?{" "}
        <AuthHelperLink onClick={() => router.navigate({ to: "/signUp" })}>
          Sign Up
        </AuthHelperLink>
      </p>
    </AuthFormWrapper>
  );
};
