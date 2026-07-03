import { useQuery, UseQueryOptions } from "@tanstack/react-query";

interface UseApiOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  url: string;
  queryKey: string[];
  headers?: Record<string, string>;
  basicAuth?: {
    username: string;
    password: string;
  };
  staleTime?: number;
  gcTime?: number;
}

export const useApi = <T = any>({
  url,
  queryKey,
  headers = {},
  basicAuth,
  staleTime,
  gcTime,
  ...options
}: UseApiOptions<T>) => {
  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const fetchHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (basicAuth) {
        const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
        fetchHeaders['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(url, {
        headers: fetchHeaders,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime,
    gcTime,
    ...options,
  });
};
