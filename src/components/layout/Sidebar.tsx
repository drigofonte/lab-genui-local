import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type SidebarProps = {
  side?: "left" | "right";
  sideWidth?: string;
  contentMin?: string;
  space?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Sidebar({
  side = "left",
  sideWidth = "20rem",
  contentMin = "50%",
  space = "var(--space-l)",
  className = "",
  children,
  style,
  ...rest
}: SidebarProps) {
  const classes = [
    "sidebar",
    side === "right" && "sidebar-right",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--side-width": sideWidth,
    "--content-min": contentMin,
    "--space": space,
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
