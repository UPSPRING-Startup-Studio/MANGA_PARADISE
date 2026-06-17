import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Manga Paradise — Input (charte Pop Sanctuary)
 * Style propre : fond blanc, bordure douce, focus cinabre + ring 4px.
 * On s'appuie ici sur les classes Tailwind ; le bloc `!important` agressif
 * du legacy index.css a été supprimé.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-white px-4 py-2.5 text-sm text-mp-ink placeholder:text-mp-ink-muted ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
