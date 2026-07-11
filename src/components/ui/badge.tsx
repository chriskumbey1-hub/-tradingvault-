import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900",
        {
          "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700":
            variant === "default",
          "border-transparent bg-zinc-700 text-zinc-100 hover:bg-zinc-600":
            variant === "secondary",
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700":
            variant === "destructive",
          "text-zinc-100": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
