import { useId, type ReactNode, type CSSProperties, type HTMLAttributes } from "react";

export type SwitcherProps = {
  threshold?: string;
  space?: string;
  limit?: number;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">;

export function Switcher({
  threshold = "30rem",
  space = "var(--space-s)",
  limit = 4,
  className = "",
  children,
  style,
  ...rest
}: SwitcherProps) {
  const id = useId();
  const switcherId = `switcher-${id.replace(/:/g, "")}`;

  const classes = ["switcher", switcherId, className]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--threshold": threshold,
    "--space": space,
    ...style,
  } as CSSProperties;

  const actualLimit = limit ?? 4;
  const nthChildCSS = `
    .${switcherId} > :nth-last-child(n+${actualLimit + 1}),
    .${switcherId} > :nth-last-child(n+${actualLimit + 1}) ~ * {
      flex-basis: 100%;
    }
  `;

  return (
    <>
      <style>{nthChildCSS}</style>
      <div className={classes} style={cssVars} {...rest}>
        {children}
      </div>
    </>
  );
}
