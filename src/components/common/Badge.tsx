import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "danger" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 tracking-wider uppercase",
    md: "text-xs px-2.5 py-1",
  };

  const variantStyles = {
    default: "bg-surface-elevated text-text-secondary border border-border",
    accent: "bg-accent-subtle text-accent border border-accent/30 font-medium",
    success: "bg-success-subtle text-success border border-success/30 font-medium",
    danger: "bg-danger-subtle text-danger border border-danger/30 font-medium",
    outline: "bg-transparent text-text-muted border border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-mono select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
