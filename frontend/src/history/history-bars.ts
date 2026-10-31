import type { LightSession } from './history-api';

function getDayPercentage(timestamp: number): number {
    const time = new Date(timestamp);

    const milliseconds =
        time.getHours() * 60 * 60 * 1000 +
        time.getMinutes() * 60 * 1000 +
        time.getSeconds() * 1000 +
        time.getMilliseconds();

    return (milliseconds / 86_400_000) * 100;
}

export function getSessionBar(
    session: LightSession,
    date: string,
): { left: number; width: number } | null {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const startTime = dayStart.getTime();
    const endTime = dayEnd.getTime();

    // Skip sessions that do not overlap this local calendar day.
    if (
        session.started_at >= endTime ||
        session.last_seen_at < startTime
    ) {
        return null;
    }

    // Clip the displayed segment without changing the original record.
    const left =
        session.started_at <= startTime
            ? 0
            : getDayPercentage(session.started_at);

    const right =
        session.last_seen_at >= endTime
            ? 100
            : getDayPercentage(session.last_seen_at);

    return {
        left,
        width: Math.max(0, right - left),
    };
}