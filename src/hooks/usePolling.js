import { useState, useEffect, useRef } from 'react';

export default function usePolling({ fetchFn, intervalMs = 10000, enabled = true }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const savedFetchFn = useRef(fetchFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let timeoutId;

    const poll = async () => {
      try {
        const result = await savedFetchFn.current();
        if (isMounted) {
          setData(result);
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (isMounted) setIsLoading(false);
      } finally {
        if (isMounted && enabled) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      }
    };

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [intervalMs, enabled]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const result = await savedFetchFn.current();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Manual refresh error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, lastUpdated, refresh };
}
