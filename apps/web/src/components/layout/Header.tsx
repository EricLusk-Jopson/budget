import { useAuth } from "@/contexts/auth/useAuth";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "../ui/avatar";

export const Header = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-gray-900">Leine</div>
            <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Leine
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-3">
            {user ? (
              <AuthenticatedNav user={user} onLogout={logout} />
            ) : (
              <UnauthenticatedNav />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

const AuthenticatedNav = ({
  user,
  onLogout,
}: {
  user: { displayName: string | null; email: string | null };
  onLogout: () => Promise<void>;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Link
        to="/create-budget"
        className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
      >
        Create New Budget
      </Link>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-green-600 transition-colors"
          aria-label="User menu"
        >
          <Avatar className="w-5 h-5 text-gray-600" />
        </button>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <Link
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>

              <Link
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Budgets
              </Link>

              <Link
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const UnauthenticatedNav = () => {
  return (
    <>
      <Link
        to="/signin"
        className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Sign In
      </Link>

      <Link
        to="/signup"
        className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
      >
        Sign Up
      </Link>
    </>
  );
};
