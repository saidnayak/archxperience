import React from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { cn } from "../../lib/utils";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <TopNavigation variant="app" />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar className="hidden md:flex" />
        <main className={cn("flex-1 overflow-y-auto bg-background", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};
