import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * Grow to fit the content instead of scrolling inside a fixed box.
   *
   * A fixed-height textarea holding a long answer hides most of it and clips
   * the last visible line in half, so the writer cannot read back what they
   * just wrote without scrolling a box inside a scrolling page. Growing is
   * capped, past which it scrolls — but by then there is a lot on screen.
   */
  autoGrow?: boolean;
}

/** Matches the Input spec; only the height differs. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow, ...props }, ref) => {
    const inner = React.useRef<HTMLTextAreaElement | null>(null);

    // The caller may want the node too, so both refs are fed
    const attach = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // Layout effect, not effect: resizing after paint shows one frame at the
    // old height, which reads as a jump on every keystroke
    React.useLayoutEffect(() => {
      if (!autoGrow) return;
      const element = inner.current;
      if (!element) return;
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }, [autoGrow, props.value]);

    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-md border border-mist-200 bg-white px-3 py-2.5 font-sans text-body leading-relaxed text-ink-900 transition-colors duration-fast",
          "placeholder:text-steel-400 hover:border-mist-300",
          "focus-visible:border-teal-400 focus-visible:outline-none",
          "aria-[invalid=true]:border-destructive",
          "disabled:cursor-not-allowed disabled:bg-mist-50 disabled:text-steel-500",
          autoGrow && "max-h-[28rem] resize-none",
          className,
        )}
        ref={attach}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
