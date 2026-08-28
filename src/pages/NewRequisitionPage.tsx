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
      crumbs={[{ label: "New requisition" }]}
      trail={<SectionLabel>Recruitment</SectionLabel>}
      mainClassName="pb-20"
    >
      {/* One centred column, wide enough for the form's three fields across.
          The banner shares its width so the two edges line up rather than the
          form sitting inside a wider header. */}
      <div className="mx-auto w-full max-w-form">
        {/* The one landmark gradient on the page: cropped, Water-led,
            grain-welded. Deliberately shallow — it is a signpost above a long
            form, not a marketing hero, and every row it takes is a row of
            fields pushed below the fold. */}
        <section className="surface-flow-light has-grain mt-5 overflow-hidden rounded-lg border border-frost-200 [--grain-strength:0.5]">
          <div className="relative z-raised px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-overline font-semibold uppercase text-steel-600">
              Kenafric Group · Recruitment
            </p>
            <h1 className="mt-1 max-w-measure text-h5 font-extrabold tracking-tight text-ink-900">
              Raise a new job requisition
            </h1>
            <p className="measure mt-1.5 text-caption text-steel-700">
              Describe the role and what it has to deliver. HR adds the terms — salary, benefits and
              leave — before it goes to the HR Head and the Director. Sections A to C become the
              official job description, so what you write here is what the candidate reads. It saves
              as you go, so you can leave and come back.
            </p>
          </div>
        </section>

        <div className="mt-5">
          {isLoading ? (
            <RequisitionLoading />
          ) : isUnavailable ? (
            <SchemaUnavailable isUnconfigured={isUnconfigured} onRetry={() => void refetch()} />
          ) : isFaulty ? (
            <SchemaFaultNotice fault={fault} onRetry={() => void refetch()} />
          ) : (
            <RequisitionForm schema={schema} />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default NewRequisitionPage;
