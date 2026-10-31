import type { Position } from '../bulb/bulb-api';

export type LightSession = {
  id: number;
  bulb_id: number;
  position: Position;
  started_at: number;
  last_seen_at: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 8_640_000_000_000_000
  );
}

function isLightSession(value: unknown): value is LightSession {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    typeof value.bulb_id === 'number' &&
    Number.isSafeInteger(value.bulb_id) &&
    value.bulb_id > 0 &&
    (
      value.position === 'living_room' ||
      value.position === 'bedroom' ||
      value.position === 'bathroom'
    ) &&
    isTimestamp(value.started_at) &&
    isTimestamp(value.last_seen_at) &&
    value.started_at <= value.last_seen_at
  );
}

export async function getLightSessions(
  position: Position,
  startTime: number,
  endTime: number,
  signal?: AbortSignal,
): Promise<LightSession[]> {
  const query = new URLSearchParams({
    position,
    start_time: String(startTime),
    end_time: String(endTime),
  });

  // Use the same /api proxy prefix as the other frontend requests.
  const response = await fetch(`/api/light-sessions?${query}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load lighting history (${response.status}).`,
    );
  }

  // Validate server data before using it in the chart.
  const data: unknown = await response.json();

  if (
    !isRecord(data) ||
    data.position !== position ||
    data.start_time !== startTime ||
    data.end_time !== endTime ||
    !Array.isArray(data.sessions)
  ) {
    throw new Error('Invalid lighting history response.');
  }

  const sessions: LightSession[] = [];

  for (const session of data.sessions) {
    if (!isLightSession(session) || session.position !== position) {
      throw new Error('Invalid lighting session.');
    }

    sessions.push(session);
  }

  return sessions;
}