import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../common/Button";
import { Dropdown } from "../common/Dropdown";
import { useAuthStore } from "../../stores";
import { useToast } from "../common/Toast";
import {
  Layers,
  Compass,
  ArrowRight,
  Cloud,
  HardDrive,
  User,
  LogOut,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { DEMO_PROJECT_ID } from "../../lib/demo-data";

export interface TopNavigationProps {
  variant?: "marketing" | "app";
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ variant = "marketing" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, mode, signOut } = useAuthStore();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast("Signed out of cloud workspace", "info");
      navigate("/dashboard");
    } catch {
      showToast("Failed to sign out", "danger");
    }
  };

  const accountDropdownItems = user
    ? [
        {
          id: "user-info",
          label: user.email || "Architect",
          icon: <User className="w-3.5 h-3.5" />,
          disabled: true,
        },
        {
          id: "sign-out",
          label: "Sign Out",
          icon: <LogOut className="w-3.5 h-3.5" />,
          danger: true,
          onClick: handleSignOut,
        },
      ]
    : [
        {
          id: "guest-info",
          label: "Guest Architect",
          icon: <User className="w-3.5 h-3.5" />,
          disabled: true,
        },
        {
          id: "sign-in",
          label: "Sign In to Cloud",
          icon: <LogIn className="w-3.5 h-3.5" />,
          onClick: () => navigate("/auth"),
        },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md select-none">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Workspace Mode Pill */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-text-primary shadow-sm group-hover:bg-accent-hover transition-colors">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display text-sm font-semibold tracking-architectural uppercase text-text-primary">
                ARCH
              </span>
              <span className="font-display text-sm font-semibold tracking-architectural uppercase text-accent">
                XPERIENCE
              </span>
            </div>
          </Link>

          {/* Workspace Mode Badge Indicator */}
          {variant === "app" && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                mode === "cloud" && user
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-surface-elevated text-text-secondary border-border"
              }`}
              title={
                mode === "cloud" && user
                  ? "Connected to Supabase PostgreSQL & Storage"
                  : "Running on browser LocalStorage"
              }
            >
              {mode === "cloud" && user ? (
                <>
                  <Cloud className="w-3 h-3 text-success" />
                  <span className="font-medium">Cloud Workspace</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3 text-text-muted" />
                  <span>Local Workspace</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Links (for marketing) */}
        {variant === "marketing" && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-text-secondary">
            <a href="#concept" className="hover:text-text-primary transition-colors">
              Concept
            </a>
            <a href="#showcase" className="hover:text-text-primary transition-colors">
              Interactive Teaser
            </a>
            <a href="#features" className="hover:text-text-primary transition-colors">
              Capabilities
            </a>
            <a href="#use-cases" className="hover:text-text-primary transition-colors">
              AEC Solutions
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {location.pathname !== "/dashboard" && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
                Projects
              </Button>
            </Link>
          )}

          {location.pathname !== "/dashboard" && (
            <Link to={`/editor/${DEMO_PROJECT_ID}`}>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open Studio
              </Button>
            </Link>
          )}

          {/* Account Profile / Mode Menu */}
          {variant === "app" && (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              {user ? (
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-surface-elevated text-xs text-text-primary border border-transparent hover:border-border transition-all">
                      <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-[10px]">
                        {user.email?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <span className="max-w-[120px] truncate text-xs font-medium">
                        {user.email}
                      </span>
                      <ChevronDown className="w-3 h-3 text-text-muted" />
                    </div>
                  }
                  items={accountDropdownItems}
                  align="right"
                />
              ) : (
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<LogIn className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
