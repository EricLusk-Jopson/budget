import React, { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth/useAuth";
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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendPasswordResetEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setSuccess(true);
    } catch (error: any) {
      // Handle common Firebase errors
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to send password reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthFormWrapper title="Check Your Email">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-6">
            Didn't receive link? Check your spam or try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
            >
              Try Another Email
            </button>
            <AuthHelperLink onClick={() => router.navigate({ to: "/signIn" })}>
              Back to Sign In
            </AuthHelperLink>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper title="Reset Your Password">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Enter your email to receive a link to reset your password.
        </p>
      </div>

      <AuthForm onSubmit={handleSubmit}>
        <div>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <AuthSubmitButton loading={loading}>
          {loading ? "Sending..." : "Send Reset Email"}
        </AuthSubmitButton>
      </AuthForm>

      <p className="text-center text-gray-600 mt-4">
        Remember your password?{" "}
        <AuthHelperLink onClick={() => router.navigate({ to: "/signIn" })}>
          Back to Sign In
        </AuthHelperLink>
      </p>
    </AuthFormWrapper>
  );
};
