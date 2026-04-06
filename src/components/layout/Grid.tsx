import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type GridProps = {
  min?: string;
  space?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Grid({
  min = "250px",
  space = "var(--space-m)",
  className = "",
  children,
  style,
  ...rest
}: GridProps) {
  const classes = ["grid", className].filter(Boolean).join(" ");
  const cssVars = {
    "--grid-min": min,
    "--space": space,
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
