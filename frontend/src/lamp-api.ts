export type Position = 'bathroom' | 'bedroom' | 'living_room';

export type Lamp = {
  id: number;
  serial_number: string;
  name: string;
  position: Position | null;
};

// This order follows the English position names.
export const positions: Position[] = [
  'bathroom',
  'bedroom',
  'living_room',
];

export function isPosition(value: unknown): value is Position {
  return (
    value === 'bathroom' ||
    value === 'bedroom' ||
    value === 'living_room'
  );
}

function isLamp(value: unknown): value is Lamp {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'id' in value &&
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    'name' in value &&
    typeof value.name === 'string' &&
    'serial_number' in value &&
    typeof value.serial_number === 'string' &&
    'position' in value &&
    (value.position === null || isPosition(value.position))
  );
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`/api${path}`, {
    ...options,
    cache: 'no-store',
  });

  // Proxy or server failures may return something other than JSON.
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function getLamps(signal?: AbortSignal): Promise<Lamp[]> {
  const data = await request('/lamps', { signal });

  // TypeScript types alone cannot validate data received over the network.
  if (!Array.isArray(data) || !data.every(isLamp)) {
    throw new Error('Invalid lamp response.');
  }

  return data;
}

export function createLamp(): Promise<unknown> {
  // The backend generates the ID, serial number, and initial name.
  return request('/lamps', {
    method: 'POST',
  });
}

export function renameLamp(id: number, name: string): Promise<unknown> {
  return request(`/lamps/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
}

export function installLamp(
  id: number,
  position: Position,
): Promise<unknown> {
  return request(`/lamps/${id}/position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ position }),
  });
}

export function uninstallLamp(id: number): Promise<unknown> {
  return request(`/lamps/${id}/position`, {
    method: 'DELETE',
  });
}