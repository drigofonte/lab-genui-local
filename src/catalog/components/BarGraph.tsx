import type { BaseComponentProps } from "@json-render/react";

interface BarGraphProps {
  title: string | null;
  data: Array<{ label: string; value: number }>;
  color: string | null;
}

export function BarGraph({ props }: BaseComponentProps<BarGraphProps>) {
  const maxValue = Math.max(...props.data.map((d) => d.value), 1);
  const barColor = props.color ?? "hsl(var(--primary))";

  return (
    <div className="rounded-lg border bg-card p-4">
      {props.title && (
        <h3 className="mb-3 text-sm font-medium">{props.title}</h3>
      )}
      <div className="space-y-2">
        {props.data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 truncate text-sm text-muted-foreground">
              {item.label}
            </span>
            <div className="flex-1">
              <div
                className="h-5 rounded-sm"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: barColor,
                  minWidth: "2px",
                }}
              />
            </div>
            <span className="w-12 text-right text-sm font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
