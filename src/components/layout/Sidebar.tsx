import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { LayoutGrid, FolderKanban, Settings, Layers, HelpCircle } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to: string;
  badge?: string;
}

export const Sidebar: React.FC<{ className?: string }> = ({ className }) => {
  const navItems: SidebarItem[] = [
    {
      id: "projects",
      label: "All Projects",
      icon: <FolderKanban className="w-4 h-4" />,
      to: "/dashboard",
    },
    {
      id: "templates",
      label: "AEC Templates",
      icon: <LayoutGrid className="w-4 h-4" />,
      to: "/dashboard?tab=templates",
      badge: "3",
    },
    {
      id: "library",
      label: "Asset Library",
      icon: <Layers className="w-4 h-4" />,
      to: "/dashboard?tab=library",
    },
    {
      id: "settings",
      label: "Preferences",
      icon: <Settings className="w-4 h-4" />,
      to: "/dashboard?tab=settings",
    },
  ];

  return (
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-border bg-surface flex flex-col justify-between p-3 select-none",
        className
      )}
    >
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-architectural text-text-muted">
          Workspace
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-3 px-3 py-2 rounded text-xs font-medium transition-colors",
                isActive
                  ? "bg-surface-elevated text-text-primary border border-border/80"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
              )
            }
          >
            <div className="flex items-center gap-2.5">
              <span className="text-text-muted">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[10px] font-mono text-accent">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-border pt-3 space-y-1">
        <a
          href="#docs"
          className="flex items-center gap-2.5 px-3 py-2 rounded text-xs text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Documentation & Guidelines</span>
        </a>
      </div>
    </aside>
  );
};
