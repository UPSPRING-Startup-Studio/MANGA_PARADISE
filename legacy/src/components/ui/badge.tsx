import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Manga Paradise — Badge (charte Pop Sanctuary)
 * Variants : default (cinabre), soft, outline, success, warning, danger, premium, association.
 * Conserve : secondary, destructive (legacy compat).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        soft: "border border-primary/20 bg-[hsl(var(--mp-primary-50))] text-[hsl(var(--mp-primary-600))]",
        outline: "border border-border bg-transparent text-mp-ink",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        danger: "border-transparent bg-red-100 text-red-800",
        premium:
          "border-transparent bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-[hsl(var(--mp-orange))] text-amber-900",
        association: "border-transparent bg-violet-100 text-violet-800",
        // legacy compat
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
