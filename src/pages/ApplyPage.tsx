import { useCallback, useEffect, useState } from "react";
import { useBlocker, useNavigate, useParams, type BlockerFunction } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePositions } from "@/hooks/usePositions";
import { PageShell, SectionLabel } from "@/components/AppShell";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { RoleUnavailable } from "@/components/careers/RoleUnavailable";
import { DeadlineChip } from "@/components/careers/primitives";
import { deadlineNote } from "@/components/careers/position";
import { applyPath, rolePath, useDocumentMeta } from "@/lib/seo";

/**
 * The application form for one role, on its own page.
 *
 * A candidate reaches it from Apply now on the role page, having read the
 * role. The form owns the page, with the role named above it so nobody
 * applies for the wrong one; the role itself is one link back.
 */
const ApplyPage = () => {
  const { positionId = "" } = useParams();
  const navigate = useNavigate();
  const { positions, isLoading, isUnavailable, refetch } = usePositions();

  const position = positions.find((p) => p.id === positionId);
  const [isDirty, setIsDirty] = useState(false);

  useDocumentMeta({
    title: position ? `Apply: ${position.name}` : undefined,
    path: applyPath(positionId),
    noindex: true,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [positionId]);

  // The router's own guard: it covers the back button and every in-app link
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
    [isDirty],
  );
  const blocker = useBlocker(shouldBlock);

  // The browser's guard, for a refresh or a closed tab
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const goBoard = useCallback(() => navigate("/"), [navigate]);

  if (isLoading) return <RoleUnavailable variant="loading" onBack={goBoard} />;

  if (!position) {
    return isUnavailable ? (
      <RoleUnavailable variant="error" onBack={goBoard} onRetry={() => void refetch()} />
    ) : (
      <RoleUnavailable variant="closed" onBack={goBoard} />
    );
  }

  return (
    <PageShell
      width="full"
      crumbs={[
        { label: "All roles", to: "/" },
        { label: position.name, to: rolePath(position.id), compactHidden: true },
        { label: "Apply" },
      ]}
      trail={<SectionLabel>Careers</SectionLabel>}
      mainClassName="pb-16"
    >
      <section className="surface-sweep-light mt-6 overflow-hidden rounded-xl border border-frost-200 lg:mt-8">
        <div className="flex flex-col gap-3 px-6 py-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-overline font-semibold uppercase tracking-wider text-teal-700">
              Applying for
            </p>
            <h1 className="mt-1.5 text-balance text-h3 font-extrabold tracking-tight text-ink-900">
              {position.name}
            </h1>
            {position.company ? (
              <p className="mt-1 text-body-sm text-steel-600">{position.company}</p>
            ) : null}
          </div>
          {position.applicationDeadline ? (
            <DeadlineChip
              date={position.applicationDeadline}
              note={deadlineNote(position.applicationDeadline)}
            />
          ) : null}
        </div>
      </section>

      {/* Keyed by role: moving between roles must not carry one role's
          half-written application or uploaded files into the next */}
      <div className="mt-8">
        <ApplicationForm
          key={position.id}
          position={position}
          onDirtyChange={setIsDirty}
          onBrowseOther={goBoard}
        />
      </div>

      <AlertDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this application?</AlertDialogTitle>
            <AlertDialogDescription>
              You have started filling in this application. Leaving this page will discard what you
              have entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDirty(false);
                blocker.proceed?.();
              }}
            >
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default ApplyPage;
