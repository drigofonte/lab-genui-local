import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type FrameProps = {
  ratio?: string;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Frame({
  ratio = "16 / 9",
  className = "",
  children,
  style,
  ...rest
}: FrameProps) {
  const classes = ["frame", className].filter(Boolean).join(" ");
  const cssVars = { "--ratio": ratio, ...style } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
