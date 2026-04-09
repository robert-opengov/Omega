'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCachedRequestOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  revalidateOnMount?: boolean;
}

interface UseCachedRequestReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRevalidating: boolean;
  isStale: boolean;
  lastUpdated: number | null;
  refresh: () => Promise<T | undefined>;
  clearCache: () => void;
}

export function useCachedRequest<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: UseCachedRequestOptions = {}
): UseCachedRequestReturn<T> {
  const {
    enabled = true,
    staleTime = 60_000,
    cacheTime = 3_600_000,
    revalidateOnMount = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const isMounted = useRef(true);
  const fullCacheKey = `swr_cache_${cacheKey}`;

  const isStale = lastUpdated ? Date.now() - lastUpdated > staleTime : true;

  const getCachedData = useCallback((): { data: T; timestamp: number } | null => {
    if (!enabled) return null;
    try {
      const cached = localStorage.getItem(fullCacheKey);
      if (!cached) return null;
      const parsed = JSON.parse(cached) as { data: T; timestamp: number };
      if (Date.now() - parsed.timestamp > cacheTime) {
        localStorage.removeItem(fullCacheKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }, [enabled, fullCacheKey, cacheTime]);

  const setCachedData = useCallback((newData: T) => {
    if (!enabled) return;
    try {
      localStorage.setItem(fullCacheKey, JSON.stringify({ data: newData, timestamp: Date.now() }));
    } catch { /* ignore */ }
  }, [enabled, fullCacheKey]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(fullCacheKey);
      setLastUpdated(null);
    } catch { /* ignore */ }
  }, [fullCacheKey]);

  const fetchData = useCallback(async (showAsRevalidating = false): Promise<T | undefined> => {
    if (showAsRevalidating) setIsRevalidating(true);
    else setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetchFn();
      if (!isMounted.current) return;
      setData(freshData);
      setLastUpdated(Date.now());
      setCachedData(freshData);
      return freshData;
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    }
  }, [fetchFn, setCachedData]);

  const refresh = useCallback(() => fetchData(data !== null), [fetchData, data]);

  useEffect(() => {
    isMounted.current = true;
    const cached = getCachedData();

    if (cached) {
      setData(cached.data);
      setLastUpdated(cached.timestamp);
      setIsLoading(false);
      if (revalidateOnMount) {
        setIsRevalidating(true);
        fetchData(true).catch(() => {});
      }
    } else {
      fetchData(false).catch(() => {});
    }

    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { data, error, isLoading, isRevalidating, isStale, lastUpdated, refresh, clearCache };
}
