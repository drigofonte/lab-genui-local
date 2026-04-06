import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export type CenterProps = {
  maxWidth?: string;
  centerText?: boolean;
  gutters?: string;
  intrinsic?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Center({
  maxWidth = "60ch",
  centerText = false,
  gutters,
  intrinsic = false,
  className = "",
  children,
  style,
  ...rest
}: CenterProps) {
  const classes = [
    "center",
    centerText && "center-text",
    gutters && "center-gutters",
    intrinsic && "center-intrinsic",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--max-width": maxWidth,
    ...(gutters ? { "--gutters": gutters } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {children}
    </div>
  );
}
