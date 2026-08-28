import { Briefcase, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageNotice, PageShell, SectionLabel } from "@/components/AppShell";

const COPY = {
  loading: {
    title: "Loading this role",
    body: "One moment while we fetch the details.",
  },
  closed: {
    title: "This role is no longer open",
    body: "The position has been filled or withdrawn since this link was shared. Everything currently open is on the roles board.",
  },
  error: {
    title: "We couldn't load this role",
    body: "The listing service did not respond. Try again, and if it keeps failing, come back shortly.",
  },
} as const;

/**
 * What a role URL shows when there is no role to show.
 *
 * A deep link can outlive the requisition it points at, so "closed" is a
 * normal outcome and reads as one — distinct from the service being down,
 * which is the only case worth offering a retry.
 */
export const RoleUnavailable = ({
  variant,
  onBack,
  onRetry,
}: {
  variant: keyof typeof COPY;
  onBack: () => void;
  onRetry?: () => void;
}) => {
  const { title, body } = COPY[variant];

  return (
    <PageShell
      crumbs={[{ label: "All roles", to: "/" }]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="py-16 lg:py-24"
    >
      <PageNotice
        icon={Briefcase}
        tone={variant === "error" ? "neutral" : "water"}
        title={title}
        body={body}
        status
        actions={
          variant === "loading" ? undefined : (
            <>
              {onRetry ? (
                <Button variant="secondary" onClick={onRetry}>
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </Button>
              ) : null}
              <Button variant={onRetry ? "ghost" : "secondary"} onClick={onBack}>
                See all open roles
              </Button>
            </>
          )
        }
      />
    </PageShell>
  );
};
