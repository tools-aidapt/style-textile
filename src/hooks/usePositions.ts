import { useMemo } from "react";
import { basicAuthFor, config } from "@/lib/config";
import { parsePositionsResponse, type Position } from "@/components/careers/position";
import { useApi } from "./useApi";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * The open positions, fetched once and shared by every view through React
 * Query's cache — the board and a role page mounted from a cold URL both read
 * the same entry, so a deep link costs one request and going back costs none.
 */
export const usePositions = () => {
  const query = useApi<unknown>({
    url: config.jobsWebhookUrl,
    queryKey: ["job-positions"],
    basicAuth: basicAuthFor(config.jobsWebhookUser, config.jobsWebhookPassword),
    enabled: !!config.jobsWebhookUrl,
    staleTime: FIVE_MINUTES,
    gcTime: 2 * FIVE_MINUTES,
  });

  // Parsing on every render handed every consumer a new array, which defeated
  // their own memoised filtering
  const positions: Position[] = useMemo(
    () => parsePositionsResponse(query.data),
    [query.data],
  );

  return {
    positions,
    isLoading: query.isLoading,
    /** Either the fetch failed or the app was deployed without its webhook URL. */
    isUnavailable: query.isError || !config.jobsWebhookUrl,
    refetch: query.refetch,
  };
};
