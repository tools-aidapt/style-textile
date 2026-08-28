import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPRING, useSpringStyle } from "@/lib/motion";

/**
 * A floating way to apply, for the middle of a long role page.
 *
 * The only apply affordance was a jump link in the masthead. On a fully
 * written role that is a couple of thousand pixels above the form, so a
 * candidate who decided halfway down had nothing to act on — the answer to
 * "how do I do the thing this page is for" was scroll back up, or keep
 * scrolling and hope.
 *
 * It earns its place by staying out of the way: it is absent at the top, where
 * the masthead button is still visible, and absent again once the form itself
 * is on screen, where a second button would just be a duplicate.
 *
 * The bar springs rather than slides. A spring animates from wherever the bar
 * currently is, so scrolling back and forth across the threshold reverses the
 * motion mid-flight instead of restarting it from a jump.
 */
export const ApplyBar = ({
  /** The masthead's own button. While it is visible, this bar is not needed. */
  topAnchorId,
  /** The form. Once it is in view, the bar has been replaced by the real thing. */
  formAnchorId,
  roleName,
}: {
  topAnchorId: string;
  formAnchorId: string;
  roleName: string;
}) => {
  const [topVisible, setTopVisible] = React.useState(true);
  const [formVisible, setFormVisible] = React.useState(false);

  React.useEffect(() => {
    const top = document.getElementById(topAnchorId);
    const form = document.getElementById(formAnchorId);
    if (!top || !form) return;

    // The header is 64px of floating chrome; an anchor sitting under it is not
    // visible to the reader even though it intersects the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === top) setTopVisible(entry.isIntersecting);
          if (entry.target === form) setFormVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "-72px 0px -80px 0px" },
    );

    observer.observe(top);
    observer.observe(form);
    return () => observer.disconnect();
  }, [topAnchorId, formAnchorId]);

  const shown = !topVisible && !formVisible;

  const ref = useSpringStyle<HTMLDivElement>(
    shown ? 0 : 1,
    (element, value) => {
      // Travel and fade together, so the bar reads as one surface arriving
      // rather than a rectangle that faded in where it already was
      element.style.transform = `translate3d(0, ${value * 140}%, 0)`;
      element.style.opacity = String(1 - value);
    },
    SPRING.move,
  );

  // A button that is off-screen must not be in the tab order, and must not be
  // read out as an option that exists. `inert` takes the subtree out of both
  // at once; it is set imperatively because React 18 does not carry the
  // attribute through JSX.
  React.useEffect(() => {
    ref.current?.toggleAttribute("inert", !shown);
  }, [ref, shown]);

  return (
    <div
      ref={ref}
      aria-hidden={shown ? undefined : true}
      className="motion-crossfade pointer-events-none fixed inset-x-0 bottom-0 z-sticky flex justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] will-change-transform"
    >
      <div className="chrome-float pointer-events-auto flex max-w-full items-center gap-3 rounded-pill py-2 pl-5 pr-2">
        <p className="hidden min-w-0 truncate text-body-sm font-medium text-[color:var(--text-vibrant)] sm:block">
          {roleName}
        </p>
        <span className="hidden h-5 w-px shrink-0 bg-mist-200 sm:block" aria-hidden="true" />
        <Button asChild className="shrink-0 rounded-pill">
          <a href={`#${formAnchorId}`}>
            Apply for this role
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
};
