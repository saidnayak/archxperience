import React from "react";
import { cn } from "../../lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", "aria-label": ariaLabel, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center transition-all duration-150 rounded select-none cursor-pointer " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95";

    const sizeStyles = {
      sm: "w-8 h-8 text-xs",
      md: "w-9 h-9 text-sm",
      lg: "w-10 h-10 text-base",
    };

    const variantStyles = {
      primary: "bg-accent text-text-primary hover:bg-accent-hover shadow-sm",
      secondary: "bg-surface-elevated text-text-primary hover:bg-surface-subtle border border-border",
      ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-subtle",
      danger: "bg-danger text-text-primary hover:bg-danger/90",
      outline: "bg-transparent text-text-primary border border-border hover:border-border-strong hover:bg-surface/50",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
