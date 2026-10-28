import { useRequisitionSchema } from "@/hooks/useRequisitionSchema";
import { useDocumentMeta } from "@/lib/seo";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { RequisitionForm } from "@/components/requisition/RequisitionForm";
import {
  RequisitionLoading,
  SchemaFaultNotice,
  SchemaUnavailable,
} from "@/components/requisition/RequisitionStates";

/**
 * Raise a new job requisition.
 *
 * An internal page: a requesting manager describes a role, HR adds the terms,
 * and it goes to the HR Head and then the Director for approval. Sections A to
 * C become the official job description verbatim, which is why this is an app
 * rather than a ClickUp form view — a form view has no numeric ranges, no
 * cross-field checks, no repeating rows, no live preview and no draft saving.
 *
 * The page itself never scrolls: the banner is fixed above, the wizard's own
 * footer (Back/Continue, or Review's submit) is fixed below it, and the one
 * place that scrolls is the step content between them — `RequisitionForm`
 * owns that split. A section too tall for the screen scrolls in place rather
 * than carrying the nav bar off with it.
 */
const NewRequisitionPage = () => {
  const { schema, fault, isFaulty, isLoading, isUnavailable, isUnconfigured, refetch } =
    useRequisitionSchema();

  useDocumentMeta({
    title: "Raise a job requisition",
    description:
      "Raise a new job requisition. The requesting manager describes the role; HR adds the terms.",
    path: "/requisitions/new",
    noindex: true,
  });

  return (
    <PageShell
      width="full"
      crumbs={[{ label: "New requisition" }]}
      trail={<SectionLabel>Recruitment</SectionLabel>}
      mainClassName="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden pb-0"
    >
      {/* The full width, not a centred column: the wizard spends it on a step
          rail beside the active step rather than on longer text lines — each
          step's own fields still sit on the measure the three-column grid was
          designed for. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* The one landmark gradient on the page: cropped, Water-led,
            grain-welded. Deliberately shallow and fixed in place — it is a
            signpost above the wizard, not something that eats into the
            section's own room to breathe. */}
        <section className="surface-flow-light has-grain mt-4 shrink-0 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5]">
          <div className="relative z-raised flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 sm:px-6">
            <h1 className="text-h6 font-extrabold tracking-tight text-ink-900 sm:text-h5">
              Raise a new job requisition
            </h1>
            <p className="text-caption text-steel-700">
              Kenafric Group · Recruitment — a step at a time, saved as you go
            </p>
          </div>
        </section>

        <div className="mt-4 min-h-0 flex-1">
          {isLoading ? (
            <div className="mx-auto h-full max-w-form overflow-y-auto">
              <RequisitionLoading />
            </div>
          ) : isUnavailable ? (
            <div className="mx-auto h-full max-w-form overflow-y-auto">
              <SchemaUnavailable isUnconfigured={isUnconfigured} onRetry={() => void refetch()} />
            </div>
          ) : isFaulty ? (
            <div className="mx-auto h-full max-w-form overflow-y-auto">
              <SchemaFaultNotice fault={fault} onRetry={() => void refetch()} />
            </div>
          ) : (
            // The wizard owns the full height from here — its own scroll
            // region and fixed footer live inside RequisitionForm.
            <RequisitionForm schema={schema} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default NewRequisitionPage;
