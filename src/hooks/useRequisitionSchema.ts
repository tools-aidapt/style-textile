import { useMemo } from "react";
import { basicAuthFor, config } from "@/lib/config";
import {
  describeSchemaFault,
  isSchemaFaulty,
  parseSchemaResponse,
  type RequisitionSchema,
  type SchemaFault,
} from "@/requisition/schema";
import { useApi } from "./useApi";

const TEN_MINUTES = 10 * 60 * 1000;

const EMPTY_SCHEMA: RequisitionSchema = { fields: {}, missingKeys: [] };

/**
 * The workspace form schema — every option list the form offers.
 *
 * n8n reads it from ClickUp and caches it, so the app holds no field ids and no
 * option list can drift out of sync with the workspace. A schema that is short
 * a field is a fault, not a smaller form: the app refuses to render rather than
 * quietly dropping whatever the manager typed into it.
 */
export const useRequisitionSchema = () => {
  const query = useApi<unknown>({
    url: config.requisitionSchemaUrl,
    queryKey: ["requisition-schema"],
    basicAuth: basicAuthFor(config.requisitionWebhookUser, config.requisitionWebhookPassword),
    enabled: !!config.requisitionSchemaUrl,
    staleTime: TEN_MINUTES,
    gcTime: 2 * TEN_MINUTES,
  });

  const schema = useMemo(
    () => (query.data ? parseSchemaResponse(query.data) : EMPTY_SCHEMA),
    [query.data],
  );

  const fault: SchemaFault = useMemo(
    () => (query.data ? describeSchemaFault(schema) : { missing: [], optionless: [] }),
    [query.data, schema],
  );

  return {
    schema,
    fault,
    isFaulty: !!query.data && isSchemaFaulty(fault),
    isLoading: query.isLoading,
    /** Either the fetch failed or the app was deployed without its schema URL. */
    isUnavailable: query.isError || !config.requisitionSchemaUrl,
    isUnconfigured: !config.requisitionSchemaUrl,
    refetch: query.refetch,
  };
};
