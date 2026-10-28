import { useMemo } from "react";
import { config } from "@/lib/config";
import { parsePeople, type DirectoryPerson } from "@/requisition/directory";
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

/**
 * The employee register — who holds a ClickUp seat and can be the requesting
 * manager, because the wire contract names them by user id.
 */
export const useEmployees = (): Directory =>
  useDirectoryAt(config.employeesWebhookUrl, "kenafric-employees");

/** Reports-to and the interview panel come from the user list. */
export const useUsers = (): Directory =>
  useDirectoryAt(config.usersWebhookUrl, "kenafric-users");
