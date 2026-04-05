import type { BaseComponentProps } from "@json-render/react";

interface MetricProps {
  label: string;
  value: string;
  description: string | null;
  trend: "up" | "down" | "neutral" | null;
}

const trendIcons: Record<string, string> = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
};

const trendColors: Record<string, string> = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-muted-foreground",
};

export function Metric({ props }: BaseComponentProps<MetricProps>) {
  const label = props.label ?? "—";
  const value = props.value ?? "—";

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {props.trend && trendIcons[props.trend] && (
          <span className={`text-sm font-medium ${trendColors[props.trend] ?? ""}`}>
            {trendIcons[props.trend]}
          </span>
        )}
      </div>
      {props.description && (
        <p className="mt-1 text-xs text-muted-foreground">
          {props.description}
        </p>
      )}
    </div>
  );
}
