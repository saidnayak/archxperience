import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Compass, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-text-primary text-center grid-pattern">
      <div className="w-12 h-12 rounded bg-surface-elevated text-accent flex items-center justify-center border border-border mb-4">
        <Compass className="w-6 h-6" />
      </div>
      <span className="text-xs font-mono text-accent uppercase tracking-wider mb-2">
        Error 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
        Spatial Coordinate Not Found
      </h1>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mt-2 mb-6">
        The presentation or page you are looking for has been moved or does not exist in this workspace.
      </p>
      <Link to="/">
        <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Platform
        </Button>
      </Link>
    </div>
  );
};
