import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Aidapt's button spec, applied to the shadcn primitive so every call site
 * inherits it: sizes 36/44/52px, 8px radius, semibold Inter, and an Ink label
 * on both Teal and Ember — white on those fills is off-brand.
 *
 * `cta` is the Ember spark and is capped at one per view (Fire ≤5%).
 * Press feedback lands on pointer-down and springs home on release.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-body font-semibold transition-colors duration-fast disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px active:scale-[0.985] active:duration-press [touch-action:manipulation]",
  {
    variants: {
      variant: {
        // Primary — Aidapt Teal, Ink label. Hover deepens one ramp step.
        default: "bg-teal-400 text-ink-900 hover:bg-teal-500 active:bg-teal-600",
        // CTA — the Ember spark, for the one action that matters
        cta: "bg-ember-300 text-ink-900 hover:bg-ember-400 active:bg-ember-500",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#9C0800]",
        // Secondary — teal keyline, teal label, faint wash on hover
        outline: "border border-teal-400 bg-white text-teal-700 hover:border-teal-500 hover:bg-teal-50 active:bg-teal-100",
        secondary: "border border-teal-400 bg-white text-teal-700 hover:border-teal-500 hover:bg-teal-50 active:bg-teal-100",
        ghost: "text-teal-700 hover:bg-teal-50 active:bg-teal-100",
        link: "text-teal-700 underline-offset-4 hover:underline hover:text-teal-800",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-sm px-4 text-body-sm",
        lg: "h-13 px-6 text-body-lg",
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
