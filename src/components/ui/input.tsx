import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Aidapt input spec: 44px tall, 8px radius, hairline Mist border, 16px Inter,
 * and a 3px teal focus ring that is never removed. aria-invalid paints the
 * border, so an error is visible without relying on the message alone.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-mist-200 bg-white px-3 py-2 font-sans text-body text-ink-900 transition-colors duration-fast",
          "placeholder:text-steel-400 hover:border-mist-300",
          "focus-visible:border-teal-400 focus-visible:outline-none",
          "aria-[invalid=true]:border-destructive",
          "disabled:cursor-not-allowed disabled:bg-mist-50 disabled:text-steel-500",
          "file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-ink-900",
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
