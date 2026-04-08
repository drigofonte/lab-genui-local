import { LayoutDashboard } from "lucide-react";

/**
 * Left sidebar icon rail — placeholder for future features
 * (saved views, data sources, model config).
 */
export function AppSidebar() {
  return (
    <nav className="flex h-full flex-col items-center gap-2 border-r bg-muted/30 px-2 py-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <LayoutDashboard className="size-4" />
      </div>
    </nav>
  );
}
