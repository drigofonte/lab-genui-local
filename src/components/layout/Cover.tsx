import { Children, type ReactNode, type CSSProperties, type HTMLAttributes } from "react";

export type CoverProps = {
  space?: string;
  minHeight?: string;
  noPad?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Cover({
  space = "var(--space-m)",
  minHeight = "100vh",
  noPad = false,
  className = "",
  children,
  style,
  ...rest
}: CoverProps) {
  const classes = ["cover", className].filter(Boolean).join(" ");
  const cssVars = {
    "--min-height": minHeight,
    "--space": space,
    "--padding": noPad ? "0" : space,
    ...style,
  } as CSSProperties;

  return (
    <div className={classes} style={cssVars} {...rest}>
      {Children.map(children, (child, index) =>
        index === 0 ? (
          <div className="cover-centered">{child}</div>
        ) : (
          child
        )
      )}
    </div>
  );
}
