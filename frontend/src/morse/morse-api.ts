import {
  isPosition,
  positions,
  type Position,
} from '../bulb/bulb-api';

export type MorseMessage = {
  start_time: number;
  end_time: number;
  message: string;
  bulb_id: number;
  position: Position;
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

function isMorseMessage(value: unknown): value is MorseMessage {
  if (!isRecord(value)) return false;

  return (
    isTimestamp(value.start_time) &&
    isTimestamp(value.end_time) &&
    value.start_time < value.end_time &&
    typeof value.message === 'string' &&
    value.message.length > 0 &&
    typeof value.bulb_id === 'number' &&
    Number.isSafeInteger(value.bulb_id) &&
    value.bulb_id > 0 &&
    isPosition(value.position)
  );
}

async function checkPosition(
  position: Position,
  startTime: number,
  endTime: number,
  signal?: AbortSignal,
): Promise<MorseMessage[]> {
  const response = await fetch('/api/morse/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal,
    body: JSON.stringify({
      position,
      start_time: startTime,
      end_time: endTime,
    }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 422
        ? 'Too many sessions. Please choose a shorter time range.'
        : `Failed to search Morse messages (${response.status}).`,
    );
  }

  const data: unknown = await response.json();

  if (!isRecord(data) || !Array.isArray(data.result)) {
    throw new Error('Invalid Morse response.');
  }

  const messages: MorseMessage[] = [];

  for (const item of data.result) {
    if (
      !isMorseMessage(item) ||
      item.position !== position ||
      item.start_time < startTime ||
      item.end_time > endTime
    ) {
      throw new Error('Invalid Morse message.');
    }

    messages.push(item);
  }

  return messages;
}

export async function findMorseMessages(
  startTime: number,
  endTime: number,
  signal?: AbortSignal,
): Promise<MorseMessage[]> {
  if (
    !isTimestamp(startTime) ||
    !isTimestamp(endTime) ||
    endTime - startTime < 60_000
  ) {
    throw new Error('Invalid Morse search range.');
  }

  // Search all three historical positions.
  const results = await Promise.all(
    positions.map((position) =>
      checkPosition(position, startTime, endTime, signal),
    ),
  );

  // Combine the results and show the earliest messages first.
  return results.flat().sort(
    (a, b) =>
      a.start_time - b.start_time ||
      a.end_time - b.end_time ||
      a.bulb_id - b.bulb_id ||
      a.position.localeCompare(b.position),
  );
}