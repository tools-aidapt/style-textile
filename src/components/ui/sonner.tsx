import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts, on the Aidapt surface.
 *
 * Two things were wrong with the stock configuration. It sat bottom-right,
 * which is now where the role page's apply bar and the requisition preview
 * toggle live — a submission error arrived on top of the control the reader
 * was reaching for. And it inherited the generic shadcn palette rather than
 * the brand's: a neutral shadow instead of one tinted toward Deep Flow, and
 * Ember nowhere near the thing that failed.
 *
 * Top-centre also puts the message where attention already is after a failed
 * submit, rather than in the corner furthest from it.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    position="top-center"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:rounded-lg group-[.toaster]:border-mist-200 group-[.toaster]:bg-white group-[.toaster]:font-sans group-[.toaster]:text-body-sm group-[.toaster]:text-ink-900 group-[.toaster]:shadow-lg",
        description: "group-[.toast]:text-steel-600",
        actionButton:
          "group-[.toast]:rounded-md group-[.toast]:bg-teal-400 group-[.toast]:font-semibold group-[.toast]:text-ink-900",
        cancelButton:
          "group-[.toast]:rounded-md group-[.toast]:bg-mist-50 group-[.toast]:text-steel-700",
        // Fire marks the failure and nothing else — the spark stays ≤5%
        error: "group-[.toaster]:border-ember-200 group-[.toaster]:bg-ember-50",
        success: "group-[.toaster]:border-teal-200",
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
