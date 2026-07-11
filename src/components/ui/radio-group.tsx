"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <div
        role="radiogroup"
        ref={ref}
        className={cn("grid gap-2", className)}
        {...props}
      />
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, checked, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        value={value}
        checked={checked}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-zinc-700 text-blue-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
