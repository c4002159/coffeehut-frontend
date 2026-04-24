import { useEffect, useCallback } from 'react';

export function useAutoRefresh(callback, intervalMs = 10000) {
    const stableCallback = useCallback(callback, [callback]);
    useEffect(() => {
        stableCallback();
        const interval = setInterval(stableCallback, intervalMs);
        return () => clearInterval(interval);
    }, [stableCallback, intervalMs]);
}