import React from "react";
import { cn } from "../../lib/utils";
import { TopNavigation } from "./TopNavigation";

export interface AppShellProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  navVariant?: "marketing" | "app";
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showNavigation = true,
  navVariant = "marketing",
  className,
}) => {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-text-primary", className)}>
      {showNavigation && <TopNavigation variant={navVariant} />}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};
