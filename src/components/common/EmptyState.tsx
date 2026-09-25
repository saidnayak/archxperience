import React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded bg-surface/30",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded flex items-center justify-center bg-surface-elevated text-text-muted mb-3 border border-border">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      {description && (
        <p className="text-xs text-text-secondary mt-1 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
