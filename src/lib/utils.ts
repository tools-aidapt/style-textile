import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. The Aidapt type scale is
 * named after the design system's steps (text-h4, text-body-sm, text-overline),
 * and without being told, tailwind-merge reads those as text COLOUR utilities —
 * so `cn("text-h4", "text-ink-900")` silently dropped the size.
 *
 * Registering the scale here keeps size and colour in separate conflict groups.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "overline",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
