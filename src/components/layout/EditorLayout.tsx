import React from "react";
import { cn } from "../../lib/utils";

export interface EditorLayoutProps {
  toolbar: React.ReactNode;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  overlay?: React.ReactNode;
  className?: string;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  toolbar,
  leftPanel,
  canvas,
  rightPanel,
  overlay,
  className,
}) => {
  return (
    <div className={cn("h-screen w-screen overflow-hidden flex flex-col bg-background text-text-primary select-none", className)}>
      {/* Top Toolbar */}
      <div className="h-12 border-b border-border bg-surface shrink-0 z-20">
        {toolbar}
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Slide list / Page manager */}
        <aside className="w-64 border-r border-border bg-surface shrink-0 z-10 flex flex-col overflow-hidden">
          {leftPanel}
        </aside>

        {/* Center: Presentation Artboard Canvas Viewport */}
        <main className="flex-1 flex flex-col bg-background relative overflow-hidden items-center justify-center">
          {canvas}
        </main>

        {/* Right Panel: Properties Inspector */}
        <aside className="w-72 border-l border-border bg-surface shrink-0 z-10 flex flex-col overflow-hidden">
          {rightPanel}
        </aside>

        {/* Overlays / Modals */}
        {overlay}
      </div>
    </div>
  );
};
