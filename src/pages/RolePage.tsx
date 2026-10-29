import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
 * click from the board. The application form is a page of its own —
 * `ApplyPage` — so this one only has to be read.
 */
const RolePage = () => {
  const { positionId = "" } = useParams();
  const navigate = useNavigate();
  const { positions, isLoading, isUnavailable, refetch } = usePositions();

  const position = positions.find((p) => p.id === positionId);

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

  const goBack = useCallback(() => navigate("/"), [navigate]);

  if (isLoading) return <RoleUnavailable variant="loading" onBack={goBack} />;

  if (!position) {
    return isUnavailable ? (
      <RoleUnavailable variant="error" onBack={goBack} onRetry={() => void refetch()} />
    ) : (
      <RoleUnavailable variant="closed" onBack={goBack} />
    );
  }

  return <PositionDetail key={position.id} position={position} />;
};

export default RolePage;
