import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type BoxProps = {
  padding?: string;
  borderWidth?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Box({
  padding = "var(--space-s)",
  borderWidth,
  className = "",
  children,
  style,
  ...rest
}: BoxProps) {
  const classes = ["box", className].filter(Boolean).join(" ");
  const cssVars = {
    "--padding": padding,
    ...(borderWidth ? { "--border-width": borderWidth } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
