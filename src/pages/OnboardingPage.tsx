import { useParams } from "react-router-dom";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useDocumentMeta } from "@/lib/seo";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { OnboardingDeadEnd, OnboardingLoading } from "@/components/onboarding/OnboardingStates";
import { copy } from "@/onboarding/locale";
import { readEmployeeId } from "@/onboarding/session";

/**
 * Employee onboarding.
 *
 * Reached only from the personalised link WF-15 emails a new hire after they
 * sign their offer letter. The last part of that link is their ClickUp
 * Employee task id — the new hire has no ClickUp account and never will, so
 * there is no login in front of this.
 *
 * `noindex` is not decoration, and neither is the `referrer: no-referrer` in
 * `index.html`. The URL identifies a person, so it must not be crawled and it
 * must not travel to another host in a `Referer` header.
 */
const OnboardingPage = () => {
  const params = useParams<{ employeeId?: string }>();
  const employeeId = readEmployeeId(params.employeeId);
  const { session, fault, isLoading, refetch } = useOnboardingSession(employeeId);

  useDocumentMeta({
    title: "Your Kenafric onboarding",
    description: "Complete your employee details and upload your documents before your first day.",
    path: "/onboarding",
    noindex: true,
  });

  return (
    <PageShell
      crumbs={[{ label: "Onboarding" }]}
      trail={<SectionLabel>Kenafric Group</SectionLabel>}
      mainClassName="pb-20"
    >
      <div className="mx-auto w-full max-w-form">
        {/* The one landmark gradient: cropped, Water-led, grain-welded, and
            deliberately shallow — every row it takes is a row of the form
            pushed below the fold on a 360px screen. */}
        <section className="surface-flow-light has-grain mt-5 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5] print:hidden">
          <div className="relative z-raised px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-overline font-semibold uppercase text-steel-600">
              Kenafric Group · New joiner
            </p>
            <h1 className="mt-1 max-w-measure text-h5 font-extrabold tracking-tight text-ink-900">
              {session?.fullName ? `Welcome, ${session.fullName.split(" ")[0]}` : copy.pageTitle}
            </h1>
            <p className="measure mt-1.5 text-caption text-steel-700">{copy.pageIntro}</p>
          </div>
        </section>

        <div className="mt-5">
          {isLoading ? (
            <OnboardingLoading />
          ) : fault || !session ? (
            <OnboardingDeadEnd fault={fault ?? "unreachable"} onRetry={() => void refetch()} />
          ) : (
            <OnboardingForm employeeId={employeeId} session={session} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default OnboardingPage;
