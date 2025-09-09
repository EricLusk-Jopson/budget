import React, { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth/useAuth";
import { LabeledSeparator } from "../ui/labeledSeparator";
import {
  AuthForm,
  AuthFormWrapper,
  AuthHelperLink,
  AuthInput,
  AuthSubmitButton,
  ErrorText,
  GoogleSignInButton,
} from "./utility";

export const SignInForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // Auth context will handle the redirect automatically
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      // Auth context will handle the redirect automatically
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormWrapper title="Welcome Back">
      <GoogleSignInButton onClick={handleGoogleSignIn} loading={loading} />
      <LabeledSeparator label="Or" />

      <AuthForm onSubmit={handleSubmit}>
        <div>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <AuthInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {error && <ErrorText>{error}</ErrorText>}
          <AuthHelperLink
            onClick={() => router.navigate({ to: "/forgot-password" })}
          >
            Forgot your password?
          </AuthHelperLink>
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
