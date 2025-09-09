import type { ReactNode } from "react";
import GoogleLogo from "../../assets/google-logo.svg";
import { cn } from "@/lib/utils";

export const AuthFormWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full max-w-88">
      <div className="text-center mb-16">
        <h1 className="text-5xl text-gray-900">Leine</h1>
        <p className="text-gray-600">Building You</p>
      </div>

      <h2 className="text-center text-xl font-semibold mb-2">Welcome Back</h2>

      <div className="bg-none p-2 ">{children}</div>
    </div>
  );
};

export const AuthForm = ({ ...props }) => (
  <form className={cn(`space-y-4`, props.className)} {...props}>
    {props.children}
  </form>
);

export const AuthInput = ({ ...props }) => (
  <input
    className={cn(
      `w-full p-2 border border-gray-300 rounded-lg`,
      props.className
    )}
    {...props}
  >
    {props.children}
  </input>
);

export const AuthHelperLink = ({ ...props }) => (
  <button
    type="button"
    onClick={props.onClick}
    className={cn("text-green-600 hover:underline", props.className)}
  >
    {props.children}
  </button>
);

export const ErrorText = ({ ...props }) => (
  <p className={cn("text-red-500 text-sm", props.className)}>
    {props.children}
  </p>
);

export const AuthSubmitButton = ({ ...props }) => (
  <button
    type="submit"
    disabled={props.loading}
    className={cn(
      "w-full bg-green-600 text-white py-3 px-4 mt-4 rounded-lg hover:bg-green-700 disabled:opacity-50",
      props.children
    )}
  >
    {props.children}
  </button>
);

export const GoogleSignInButton = ({
  onClick,
  loading,
}: {
  onClick: () => Promise<void>;
  loading: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-4xl mb-2 border-1 border-gray-400 hover:bg-gray-200 disabled:opacity-50 flex flex-row justify-center items-center gap-3"
    >
      <img src={GoogleLogo} alt="Google" className="w-5 h-5" />
      Sign in with Google
    </button>
  );
};
