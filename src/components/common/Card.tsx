import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-surface border border-border",
      elevated: "bg-surface-elevated border border-border shadow-subtle",
      outline: "bg-transparent border border-border",
      interactive:
        "bg-surface border border-border hover:border-border-strong hover:bg-surface-subtle transition-all duration-200 cursor-pointer",
    };

    const paddingStyles = {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-7",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded relative overflow-hidden", variantStyles[variant], paddingStyles[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
