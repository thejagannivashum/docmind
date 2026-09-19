import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20",
        success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        destructive: "bg-red-500/10 text-red-600 border-red-500/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
