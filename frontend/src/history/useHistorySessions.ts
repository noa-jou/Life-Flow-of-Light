import { useEffect, useState } from 'react';
import { getLightSessions } from './history-api';
import type { LightSession } from './history-api';
import { getQueryTimeRange } from './history-dates';

const positions = [
  'living_room',
  'bedroom',
  'bathroom',
] as const;

type HistoryResult = {
  from: string;
  to: string;
  status: 'success' | 'error';
  sessions: LightSession[];
};

export function useHistorySessions(from: string, to: string) {
  const [result, setResult] = useState<HistoryResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const { startTime, endTime } = getQueryTimeRange(from, to);

        // Do not send invalid timestamps to the backend.
        if (
          !Number.isSafeInteger(startTime) ||
          !Number.isSafeInteger(endTime) ||
          startTime < 0 ||
          startTime >= endTime
        ) {
          throw new Error('Invalid history time range.');
        }

        // Load all three positions together.
        const results = await Promise.all(
          positions.map((position) =>
            getLightSessions(
              position,
              startTime,
              endTime,
              controller.signal,
            ),
          ),
        );

        // Ignore results from a cancelled request.
        if (controller.signal.aborted) return;

        setResult({
          from,
          to,
          status: 'success',
          sessions: results.flat(),
        });
      } catch {
        if (controller.signal.aborted) return;

        // Do not display partial results as a complete history.
        controller.abort();

        setResult({
          from,
          to,
          status: 'error',
          sessions: [],
        });
      }
    }

    void load();

    // Cancel old requests when the dates change or the component unmounts.
    return () => controller.abort();
  }, [from, to]);

  // Only expose results that belong to the selected date range.
  const current =
    result?.from === from && result?.to === to
      ? result
      : null;

  return {
    sessions: current?.sessions ?? [],
    loading: current === null,
    failed: current?.status === 'error',
  };
}