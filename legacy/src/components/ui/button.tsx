import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Manga Paradise — Button (charte Pop Sanctuary)
 * Variants principales : default (cinabre), secondary, outline, ghost, link, cta (gradient), danger
 * Variants legacy conservées : destructive, hero, neon (mappées sans glow agressif)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[hsl(var(--mp-primary-600))] shadow-primary hover:shadow-primary-lg",
        secondary:
          "bg-white border border-border text-mp-ink hover:bg-mp-paper hover:border-primary/25 shadow-sm",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "text-mp-ink hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-coral))] text-white font-display italic uppercase tracking-wide shadow-primary hover:shadow-primary-lg",
        danger:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // legacy aliases (compat)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        hero: "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-coral))] text-white font-display italic uppercase tracking-wide shadow-primary hover:shadow-primary-lg",
        neon: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-13 rounded-lg px-7 text-base",
        xl: "h-16 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
