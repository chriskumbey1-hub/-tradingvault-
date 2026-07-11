import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const statsCardVariants = cva(
  "rounded-xl border p-6 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-zinc-800 bg-zinc-900/50",
        success: "border-emerald-500/20 bg-emerald-500/5",
        danger: "border-red-500/20 bg-red-500/5",
        warning: "border-amber-500/20 bg-amber-500/5",
        info: "border-blue-500/20 bg-blue-500/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

function StatsCard({
  className,
  variant,
  title,
  value,
  change,
  icon,
  ...props
}: StatsCardProps) {
  return (
    <div className={cn(statsCardVariants({ variant }), className)} {...props}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-zinc-100">{value}</p>
        {change !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            {change > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : change < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-zinc-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                change > 0
                  ? "text-emerald-500"
                  : change < 0
                  ? "text-red-500"
                  : "text-zinc-500"
              )}
            >
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatsCard, statsCardVariants };
