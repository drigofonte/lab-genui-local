import { Children, type ReactNode, type CSSProperties, type HTMLAttributes } from "react";

export type StackProps = {
  space?: string;
  recursive?: boolean;
  splitAfter?: number;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Stack({
  space = "var(--space-s)",
  recursive = false,
  splitAfter,
  className = "",
  children,
  style,
  ...rest
}: StackProps) {
  const classes = [
    recursive ? "stack stack-recursive" : "stack",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = { "--space": space, ...style } as CSSProperties;

  if (!splitAfter) {
    return (
      <div className={classes} style={cssVars} {...rest}>
        {children}
      </div>
    );
  }

  const childArray = Children.toArray(children);
  return (
    <div className={classes} style={cssVars} {...rest}>
      {childArray.map((child, i) =>
        i + 1 === splitAfter ? (
          <div key={i} className="stack-split">
            {child}
          </div>
        ) : (
          child
        )
      )}
    </div>
  );
}
