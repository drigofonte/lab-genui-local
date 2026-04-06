import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type ClusterProps = {
  space?: string;
  justify?: string;
  align?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Cluster({
  space = "var(--space-s)",
  justify = "flex-start",
  align = "center",
  className = "",
  children,
  style,
  ...rest
}: ClusterProps) {
  const classes = ["cluster", className].filter(Boolean).join(" ");
  const cssVars = {
    "--space": space,
    "--justify": justify,
    "--align": align,
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
