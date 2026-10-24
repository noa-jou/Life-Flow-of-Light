// Send one heartbeat for the installed bulb.
// The backend determines the position and timestamp.
export async function sendHeartbeat(
  bulbId: number,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/bulbs/${bulbId}/heartbeat`, {
    method: 'POST',
    signal,
  });

  // Both statuses represent a successfully recorded heartbeat.
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Heartbeat failed: HTTP ${response.status}`);
  }
}