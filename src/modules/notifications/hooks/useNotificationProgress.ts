import { useEffect, useState } from 'react';
import { DispatchProgress, notificationsApi } from '../api/notificationsApi';

export function useNotificationProgress(entityId?: string, pollIntervalMs: number = 1500) {
  const [progress, setProgress] = useState<DispatchProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!entityId) return;

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        setLoading(true);
        const data = await notificationsApi.getProgress(entityId);
        if (isMounted) {
          setProgress(data);
          // If dispatches are ongoing, schedule next poll
          if (data.is_ongoing) {
            timer = setTimeout(fetchProgress, pollIntervalMs);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dispatch progress:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgress();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [entityId, pollIntervalMs]);

  return { progress, loading };
}
