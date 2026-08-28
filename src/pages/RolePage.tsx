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
import { PositionDetail } from "@/components/careers/PositionDetail";
import { RoleUnavailable } from "@/components/careers/RoleUnavailable";
import { jobPostingJsonLd, positionSummary, rolePath, useDocumentMeta } from "@/lib/seo";
import { config } from "@/lib/config";

/**
 * One role, at its own URL.
 *
 * The role lives in the shared positions cache rather than in navigation
 * state, so a pasted link, a refresh and a bookmark all work the same as a
 * click from the board.
 */
const RolePage = () => {
  const { positionId = "" } = useParams();
  const navigate = useNavigate();
  const { positions, isLoading, isUnavailable, refetch } = usePositions();

  const position = positions.find((p) => p.id === positionId);
  const [isDirty, setIsDirty] = useState(false);

  useDocumentMeta({
    title: position?.name,
    description: position ? positionSummary(position) : undefined,
    path: rolePath(positionId),
  });

  // Structured data for the role, removed again when the view leaves
  useEffect(() => {
    if (!position) return;
    const url = new URL(rolePath(position.id), config.siteUrl).toString();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jobPostingJsonLd(position, url));
    document.head.appendChild(script);
    return () => script.remove();
  }, [position]);

  // Each view starts at the top; without this, opening a role from halfway
  // down the board lands mid-page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [positionId]);

  // The router's own guard: it covers the back button and every in-app link,
  // which navigation-state alone never did
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

  const goBack = useCallback(() => navigate("/"), [navigate]);

  if (isLoading) return <RoleUnavailable variant="loading" onBack={goBack} />;

  if (!position) {
    return isUnavailable ? (
      <RoleUnavailable variant="error" onBack={goBack} onRetry={() => void refetch()} />
    ) : (
      <RoleUnavailable variant="closed" onBack={goBack} />
    );
  }

  return (
    <>
      {/* Keyed by role: moving between roles must not carry one role's
          half-written application, uploaded files or read-progress into
          the next. The page no longer unmounts between them. */}
      <PositionDetail
        key={position.id}
        position={position}
        onBack={goBack}
        onDirtyChange={setIsDirty}
      />

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
    </>
  );
};

export default RolePage;
