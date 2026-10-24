import { useCallback, useEffect, useRef, useState } from 'react';
import type { Bulb, Position } from '../bulb/bulb-api';
import { sendHeartbeat } from './house-api';

type LightStatus = 'off' | 'starting' | 'on' | 'error';

type Runner = {
  bulbId: number;
  timer: ReturnType<typeof setInterval> | null;
  controller: AbortController | null;
  busy: boolean;
};

const HEARTBEAT_INTERVAL_MS = 200;
const REQUEST_TIMEOUT_MS = 1500;

function disposeRunner(runner: Runner) {
  // Stop future heartbeats.
  if (runner.timer !== null) {
    clearInterval(runner.timer);
  }

  // Cancel waiting for an unfinished request.
  runner.controller?.abort();
}

export function useBulbHeartbeats() {
  // State controls what React displays.
  const [lights, setLights] = useState<Record<Position, LightStatus>>({
    living_room: 'off',
    bathroom: 'off',
    bedroom: 'off',
  });

  // Refs hold running timers without causing extra renders.
  const runners = useRef(new Map<Position, Runner>());

  const stopLight = useCallback((position: Position) => {
    const runner = runners.current.get(position);

    if (runner) {
      // Remove first so late responses cannot update the interface.
      runners.current.delete(position);
      disposeRunner(runner);
    }

    setLights((current) =>
      current[position] === 'off'
        ? current
        : { ...current, [position]: 'off' },
    );
  }, []);

  const startLight = useCallback(
    (position: Position, bulbId: number) => {
      // A room must never have two heartbeat loops.
      if (runners.current.has(position)) return;

      const runner: Runner = {
        bulbId,
        timer: null,
        controller: null,
        busy: false,
      };

      runners.current.set(position, runner);

      setLights((current) => ({
        ...current,
        [position]: 'starting',
      }));

      async function pulse() {
        // Ignore stopped loops and do not overlap requests.
        if (
          runners.current.get(position) !== runner ||
          runner.busy
        ) {
          return;
        }

        runner.busy = true;

        const controller = new AbortController();
        runner.controller = controller;

        // A request must not remain pending forever.
        const timeout = setTimeout(() => {
          controller.abort();
        }, REQUEST_TIMEOUT_MS);

        try {
          await sendHeartbeat(bulbId, controller.signal);

          // The user may have switched off while we were waiting.
          if (runners.current.get(position) !== runner) return;

          // Avoid rendering again for every successful heartbeat.
          setLights((current) =>
            current[position] === 'on'
              ? current
              : { ...current, [position]: 'on' },
          );
        } catch {
          // Ignore errors from a loop that was already stopped.
          if (runners.current.get(position) !== runner) return;

          runners.current.delete(position);
          disposeRunner(runner);

          setLights((current) => ({
            ...current,
            [position]: 'error',
          }));
        } finally {
          clearTimeout(timeout);
          runner.busy = false;

          if (runner.controller === controller) {
            runner.controller = null;
          }
        }
      }

      // Send the first heartbeat immediately.
      void pulse();

      // Aim for a heartbeat every 200 ms.
      // Skip a tick if the previous request is still pending.
      runner.timer = setInterval(() => {
        void pulse();
      }, HEARTBEAT_INTERVAL_MS);
    },
    [],
  );

  const stopInvalidLights = useCallback(
    (bulbs: Bulb[]) => {
      for (const [position, runner] of runners.current) {
        const stillInstalled = bulbs.some(
          (bulb) =>
            bulb.id === runner.bulbId &&
            bulb.position === position,
        );

        // Never transfer a running loop to a replacement bulb.
        if (!stillInstalled) {
          stopLight(position);
        }
      }
    },
    [stopLight],
  );

  useEffect(() => {
    const activeRunners = runners.current;

    return () => {
      // Clean up when House is actually removed from the page.
      for (const runner of activeRunners.values()) {
        disposeRunner(runner);
      }

      activeRunners.clear();
    };
  }, []);

  return {
    lights,
    startLight,
    stopLight,
    stopInvalidLights,
  };
}