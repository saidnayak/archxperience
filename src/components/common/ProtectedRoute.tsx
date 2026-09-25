import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { Layers } from "lucide-react";

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, mode, initialized, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen w-full bg-background text-text-primary flex flex-col items-center justify-center p-6 select-none grid-pattern">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-accent text-text-primary flex items-center justify-center shadow-accent-glow animate-pulse">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold tracking-architectural uppercase text-text-primary">
              ARCH<span className="text-accent">XPERIENCE</span>
            </h3>
            <p className="text-xs font-mono text-text-secondary">
              Connecting studio workspace...
            </p>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // If in cloud mode and user is not authenticated, redirect to /auth
  if (mode === "cloud" && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
