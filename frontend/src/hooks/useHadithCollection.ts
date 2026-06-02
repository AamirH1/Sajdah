import { useCallback, useEffect, useRef, useState } from 'react';
import { getHadithCollectionPage, HadithCollectionKey, HadithRecord } from '../services/hadithApi';

export function useHadithCollection(collection: HadithCollectionKey, pageSize = 12) {
  const [hadiths, setHadiths] = useState<HadithRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadMoreInFlight = useRef(false);
  const mountedRef = useRef(true);
  const pageRef = useRef(1);
  const loadingRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const setSafeLoading = useCallback((value: boolean) => {
    loadingRef.current = value;
    if (mountedRef.current) setLoading(value);
  }, []);

  const setSafeLoadingMore = useCallback((value: boolean) => {
    loadingMoreRef.current = value;
    if (mountedRef.current) setLoadingMore(value);
  }, []);

  const setSafePage = useCallback((value: number) => {
    pageRef.current = value;
    if (mountedRef.current) setPage(value);
  }, []);

  const setSafeHasMore = useCallback((value: boolean) => {
    hasMoreRef.current = value;
    if (mountedRef.current) setHasMore(value);
  }, []);

  const loadPage = useCallback(async (pageNumber: number, replace = false) => {
    const result = await getHadithCollectionPage(collection, pageNumber, pageSize);
    if (!mountedRef.current) return;

    setHadiths((current) => {
      if (replace) {
        return result.items;
      }

      const seen = new Set(current.map((item) => `${item.collection}-${item.number}`));
      const merged = [...current];

      for (const item of result.items) {
        const key = `${item.collection}-${item.number}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }

      return merged;
    });
    setSafePage(pageNumber);
    setSafeHasMore(result.hasMore);
  }, [collection, pageSize, setSafeHasMore, setSafePage]);

  const refresh = useCallback(async () => {
    setSafeLoading(true);
    setError(null);
    try {
      await loadPage(1, true);
    } catch (err) {
      console.warn('Refresh failed:', err);
      setHadiths([]);
      setSafeHasMore(false);
      setError('We could not load this collection right now.');
    } finally {
      setSafeLoading(false);
    }
  }, [loadPage, setSafeHasMore, setSafeLoading]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current || loadMoreInFlight.current) return;

    loadMoreInFlight.current = true;
    setSafeLoadingMore(true);
    setError(null);

    try {
      await loadPage(pageRef.current + 1, false);
    } catch (err) {
      console.warn('Failed to load more hadith:', err);
      setError('Could not load more hadith right now.');
    } finally {
      setSafeLoadingMore(false);
      loadMoreInFlight.current = false;
    }
  }, [loadPage, setSafeLoadingMore]);

  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

    const loadInitialPage = async () => {
      setSafeLoading(true);
      setSafeLoadingMore(false);
      setError(null);
      setHadiths([]);
      setSafePage(1);
      setSafeHasMore(true);

      try {
        const result = await getHadithCollectionPage(collection, 1, pageSize);
        if (cancelled) return;
        setHadiths(result.items);
        setSafePage(1);
        setSafeHasMore(result.hasMore);
      } catch (err) {
        if (cancelled) return;
        console.warn('Failed to load hadith:', err);
        setHadiths([]);
        setSafeHasMore(false);
        setError('We could not load this collection right now.');
      } finally {
        if (!cancelled) setSafeLoading(false);
      }
    };

    loadInitialPage();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      loadMoreInFlight.current = false;
    };
  }, [collection, pageSize, setSafeHasMore, setSafeLoading, setSafeLoadingMore, setSafePage]);

  return {
    hadiths,
    loading,
    loadingMore,
    page,
    hasMore,
    error,
    refresh,
    loadMore,
    setError,
    setHasMore,
    setLoading,
    setHadiths,
    setPage,
  };
}
