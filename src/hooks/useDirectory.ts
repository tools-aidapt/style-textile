import { useMemo } from "react";
import { config } from "@/lib/config";
import {
  parseEmployees,
  parsePeople,
  type DirectoryPerson,
  type EmployeeRecord,
} from "@/requisition/directory";
import { useApi } from "./useApi";

const TEN_MINUTES = 10 * 60 * 1000;

const EMPTY: DirectoryPerson[] = [];

export interface Directory {
  people: DirectoryPerson[];
  isLoading: boolean;
  isUnavailable: boolean;
}

/**
 * The two people directories the form picks from.
 *
 * They are separate endpoints because they answer different questions: the
 * employee register says who can raise a requisition, the user list says who
 * can be reported to or put on a panel. Both are cached for ten minutes — a
 * staff list does not change while a manager fills a form.
 */
const useDirectoryAt = (url: string, key: string): Directory => {
  const query = useApi<unknown>({
    url,
    queryKey: [key],
    enabled: !!url,
    staleTime: TEN_MINUTES,
    gcTime: 2 * TEN_MINUTES,
  });

  const people = useMemo(
    () => (query.data ? parsePeople(query.data) : EMPTY),
    [query.data],
  );

  return {
    people,
    isLoading: query.isLoading,
    /**
     * Either the fetch failed, the app has no URL, or the endpoint answered
     * with something no shape in `parsePeople` recognised. All three leave the
     * picker with nobody to offer, which is the thing the caller has to handle.
     */
    isUnavailable: query.isError || !url || (!!query.data && people.length === 0),
  };
};

const NO_RECORDS: EmployeeRecord[] = [];

/**
 * The employee register, read twice over.
 *
 * `people` are those holding a ClickUp seat — the requesting manager has to be
 * one, because the wire contract names them by user id. `records` are every
 * employee, addressed by the task id of their record, which is what "who is
 * being replaced" links to.
 */
export const useEmployees = (): Directory & {
  records: EmployeeRecord[];
  /** Separate, because a register can serve people but no linkable records. */
  recordsUnavailable: boolean;
} => {
  const query = useApi<unknown>({
    url: config.employeesWebhookUrl,
    queryKey: ["kenafric-employees"],
    enabled: !!config.employeesWebhookUrl,
    staleTime: TEN_MINUTES,
    gcTime: 2 * TEN_MINUTES,
  });

  const people = useMemo(() => (query.data ? parsePeople(query.data) : EMPTY), [query.data]);
  const records = useMemo(
    () => (query.data ? parseEmployees(query.data) : NO_RECORDS),
    [query.data],
  );

  const failed = query.isError || !config.employeesWebhookUrl;

  return {
    people,
    records,
    isLoading: query.isLoading,
    isUnavailable: failed || (!!query.data && people.length === 0),
    recordsUnavailable: failed || (!!query.data && records.length === 0),
  };
};

/** Reports-to and the interview panel come from the user list. */
export const useUsers = (): Directory =>
  useDirectoryAt(config.usersWebhookUrl, "kenafric-users");
