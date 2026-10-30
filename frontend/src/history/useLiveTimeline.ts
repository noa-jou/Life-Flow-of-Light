import { useEffect, useRef, useState } from 'react';
import type { Position } from '../bulb/bulb-api';
import type { useBulbHeartbeats } from '../house/useBulbHeartbeats';

type Lights = ReturnType<typeof useBulbHeartbeats>['lights'];

type TimelineCell = {
    second: number;
    on: Record<Position, boolean>;
};

const CELL_COUNT = 30;

const positions: Position[] = [
    'living_room',
    'bedroom',
    'bathroom',
];

function emptyLights(): Record<Position, boolean> {
    return {
        living_room: false,
        bedroom: false,
        bathroom: false,
    };
}

function createCells(
    second: number,
    records: Map<number, Record<Position, boolean>>,
): TimelineCell[] {
    return Array.from({ length: CELL_COUNT }, (_, index) => {
        const cellSecond = second - index;

        return {
            second: cellSecond,
            on: { ...(records.get(cellSecond) ?? emptyLights()) },
        };
    });
}

export function useLiveTimeline(lights: Lights) {
    // Keep a small record of which lights were on in each second.
    const records = useRef(
        new Map<number, Record<Position, boolean>>(),
    );

    const [timeline, setTimeline] = useState(() => {
        const second = Math.floor(Date.now() / 1000);

        return {
            second,
            cells: createCells(second, new Map()),
        };
    });

    useEffect(() => {
        let lastTime = Date.now();

        function markSecond(second: number) {
            const entry = records.current.get(second) ?? emptyLights();

            for (const position of positions) {
                // Once true, keep this second gold even after the light turns off.
                if (lights[position] === 'on') {
                    entry[position] = true;
                }
            }

            records.current.set(second, entry);
        }

        function recordUntil(now: number) {
            // Reset the preview if the computer clock moves backwards.
            if (now < lastTime) {
                records.current.clear();
                lastTime = now;
                return;
            }

            const currentSecond = Math.floor(now / 1000);

            // Record the elapsed interval, including crossed second boundaries.
            // Limit the work to the visible history.
            const firstSecond = Math.max(
                Math.floor(lastTime / 1000),
                currentSecond - CELL_COUNT + 1,
            );
            const lastSecond = Math.floor((now - 1) / 1000);

            if (now > lastTime) {
                for (
                    let second = firstSecond;
                    second <= lastSecond;
                    second += 1
                ) {
                    markSecond(second);
                }
            }

            lastTime = now;
        }

        // Capture a short light pulse without waiting for the next timer tick.
        markSecond(Math.floor(lastTime / 1000));

        const timer = window.setInterval(() => {
            const now = Date.now();
            const second = Math.floor(now / 1000);

            recordUntil(now);
            markSecond(second);

            // Remove records that have moved beyond the bottom.
            for (const savedSecond of records.current.keys()) {
                if (savedSecond < second - CELL_COUNT + 1) {
                    records.current.delete(savedSecond);
                }
            }

            setTimeline({
                second,
                cells: createCells(second, records.current),
            });
        }, 100);

        return () => {
            // Finish recording the old light state before accepting a new one.
            recordUntil(Date.now());
            window.clearInterval(timer);
        };
    }, [lights]);

    return timeline;
}