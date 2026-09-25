import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Badge } from "../components/common/Badge";
import { Layers, ArrowRight, UserCheck, AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../stores";
import { isSupabaseConfigured } from "../lib/supabase";

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const { signIn, signUp, setGuestMode, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setClientError(null);
    clearError();
    setConfirmationNotice(null);
  };

  const validateForm = (): boolean => {
    setClientError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setClientError("Email address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setClientError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setClientError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setClientError("Password must be at least 6 characters long.");
      return false;
    }
    if (isSignUp && password !== confirmPassword) {
      setClientError("Passwords do not match. Please re-enter your password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmationNotice(null);
    if (!validateForm()) return;

    try {
      if (isSignUp) {
        const result = await signUp(email, password, fullName);
        if (result.needsConfirmation) {
          setConfirmationNotice(
            `Check your email to confirm your account. We've sent a verification link to ${email}.`
          );
        } else {
          navigate("/dashboard");
        }
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch {
      // Error is handled in useAuthStore
    }
  };

  const handleGuestDemo = () => {
    setGuestMode();
    navigate("/dashboard");
  };

  const activeError = clientError || error;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background text-text-primary grid-pattern">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent text-text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-display text-base font-semibold tracking-architectural uppercase text-text-primary">
              ARCH<span className="text-accent">XPERIENCE</span>
            </span>
          </Link>
          <p className="text-xs text-text-secondary">
            Architectural Presentation & Spatial Experience Studio
          </p>
        </div>

        {/* Auth Card Shell */}
        <Card variant="elevated" padding="lg" className="border-border">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              {isSignUp ? "Create Studio Account" : "Sign In to Workspace"}
            </h2>
            <Badge size="sm" variant={isSupabaseConfigured ? "accent" : "default"}>
              {isSupabaseConfigured ? "Cloud Ready" : "Local Mode"}
            </Badge>
          </div>

          {/* Email Confirmation Banner */}
          {confirmationNotice && (
            <div className="mb-4 p-3 rounded bg-success/15 border border-success/40 text-success text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success" />
              <div className="space-y-1">
                <p className="font-semibold">Verification link sent</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {confirmationNotice}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {activeError && (
            <div className="mb-4 p-3 rounded bg-danger/15 border border-danger/40 text-danger text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <p className="leading-relaxed">{activeError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                label="Architect / Studio Name"
                type="text"
                placeholder="e.g. Zaha Hadid Architects"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="architect@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              leftElement={<Mail className="w-4 h-4 text-text-muted" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />

            {isSignUp && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? isSignUp
                  ? "Creating Account..."
                  : "Signing In..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border space-y-3 text-center">
            <Button
              variant="secondary"
              size="md"
              onClick={handleGuestDemo}
              leftIcon={<UserCheck className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Continue as Guest Architect
            </Button>

            <p className="text-xs text-text-muted">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => handleToggleMode(!isSignUp)}
                className="text-accent hover:underline font-medium ml-1 cursor-pointer"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>Back to ArchXperience Home</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
