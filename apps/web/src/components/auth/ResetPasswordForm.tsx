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

interface ResetPasswordFormProps {
  code: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  code,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { confirmPasswordReset } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password strength (basic)
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(code, newPassword);
      setSuccess(true);
    } catch (error: any) {
      if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (error.code === "auth/invalid-action-code") {
        setError("This password reset link is invalid or has expired.");
      } else if (error.code === "auth/expired-action-code") {
        setError(
          "This password reset link has expired. Please request a new one."
        );
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <AuthFormWrapper title="Success!">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Your password has been reset. You can now sign in with your new
            password.
          </p>
          <button
            onClick={() => router.navigate({ to: "/signIn" })}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700"
          >
            Continue to Sign In
          </button>
        </div>
      </AuthFormWrapper>
    );
  }

  // Main form
  return (
    <AuthFormWrapper title="Confirm Your New Password">
      <div className="text-center mb-6">
        <p className="text-gray-600">Enter your new password below.</p>
      </div>

      <AuthForm onSubmit={handleSubmit}>
        <div>
          <AuthInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
          />
        </div>
        <div>
          <AuthInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <AuthSubmitButton loading={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </AuthSubmitButton>
      </AuthForm>

      <p className="text-center text-gray-600 mt-4">
        <AuthHelperLink onClick={() => router.navigate({ to: "/signIn" })}>
          Back to Sign In
        </AuthHelperLink>
      </p>
    </AuthFormWrapper>
  );
};
