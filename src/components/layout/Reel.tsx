import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type ReelProps = {
  itemWidth?: string;
  space?: string;
  height?: string;
  noBar?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Reel({
  itemWidth = "auto",
  space = "var(--space-s)",
  height = "auto",
  noBar = false,
  className = "",
  children,
  style,
  ...rest
}: ReelProps) {
  const classes = [
    "reel",
    noBar && "reel-no-bar",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--item-width": itemWidth,
    "--space": space,
    "--reel-height": height,
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
