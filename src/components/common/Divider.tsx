import React from "react";
import { cn } from "../../lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  label,
  className,
  ...props
}) => {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("w-[1px] h-full bg-border self-stretch shrink-0", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3 w-full my-3", className)} {...props}>
        <div className="h-[1px] bg-border flex-1" />
        <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono">
          {label}
        </span>
        <div className="h-[1px] bg-border flex-1" />
      </div>
    );
  }

  return <div className={cn("h-[1px] w-full bg-border my-2", className)} {...props} />;
};
