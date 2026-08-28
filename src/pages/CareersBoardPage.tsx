import { usePositions } from "@/hooks/usePositions";
import { useDocumentMeta } from "@/lib/seo";
import { PositionsBoard } from "@/components/careers/PositionsBoard";

/** The board of open roles, at the root of the site. */
const CareersBoardPage = () => {
  const { positions, isLoading, isUnavailable, refetch } = usePositions();

  useDocumentMeta({
    description:
      "Open roles at Aidapt, the operator's AI firm. Browse live positions across Operations, Intelligence and Enablement, and apply online.",
    path: "/",
  });

  return (
    <PositionsBoard
      positions={positions}
      isLoading={isLoading}
      isUnavailable={isUnavailable}
      onRetry={() => void refetch()}
    />
  );
};

export default CareersBoardPage;
