type MobileTab = "chat" | "preview";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="flex border-b bg-background">
      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
          activeTab === "chat"
            ? "border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onTabChange("preview")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
          activeTab === "preview"
            ? "border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Preview
      </button>
    </div>
  );
}
