// A session is one continuous period of lighting activity.
// All timestamps and durations below are measured in milliseconds.
export interface LightSession {
  id: number;
  bulb_id: number;
  position: string;
  started_at: number;
  last_seen_at: number;
}

// This is the public shape of one detected message.
export interface MorseMessage {
  start_time: number;
  end_time: number;
  message: string;
  bulb_id: number;
  position: string;
}

// These settings match our demo seed.
// This version does not automatically detect different sending speeds.
const HEARTBEAT_MS = 200;
const UNIT_MS = 2000;
const TOLERANCE = 0.25;

// Standard Morse timing:
// dot = 1 unit
// dash = 3 units
// gap inside a letter = 1 unit
// gap between letters = 3 units
// gap between words = 7 units
//
// The longest accepted word gap is 17,500 ms.
// A longer pause separates two messages.
export const MESSAGE_GAP_MS =
  UNIT_MS * 7 * (1 + TOLERANCE);

// Translate a complete dot/dash pattern into an English letter.
const alphabet: Record<string, string> = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z'
};

// Check whether a duration is close enough to the expected duration.
//
// Example:
// matches(2100, 1) checks whether 2,100 ms is close to one unit,
// which is 2,000 ms. With 25% tolerance, it is accepted.
function matches(actual: number, units: number): boolean {
  const expected = UNIT_MS * units;

  return (
    actual >= expected * (1 - TOLERANCE)
    && actual <= expected * (1 + TOLERANCE)
  );
}

// Estimate when the bulb turned off.
//
// Our seed stores the last heartbeat 200 ms before switch-off.
// This is an estimate, not an exact measurement of physical switch-off.
function estimatedOff(session: LightSession): number {
  return session.last_seen_at + HEARTBEAT_MS;
}

// Analyze session records without reading or changing the database.
//
// startTime and endTime define the requested search range.
// now is injectable so tests can use a fixed clock.
export function detectMorse(
  sessions: LightSession[],
  startTime: number,
  endTime: number,
  now: number = Date.now()
): MorseMessage[] {
  // Sort a copy so we do not change the caller's original array.
  const sorted = [...sessions].sort(
    (a, b) =>
      a.started_at - b.started_at
      || a.id - b.id
  );


  // Each inner array will contain the pulses of one possible letter.
  //
  // Keep invalid and long pulses in the data. They act as barriers,
  // preventing separate messages from being incorrectly joined.
  const groups: LightSession[][] = [];

  for (const session of sorted) {
    const group = groups.at(-1);
    const previous = group?.at(-1);

    // Pulses belong to the same letter when:
    // 1. They come from the same bulb and position.
    // 2. The dark gap matches one Morse unit.
    if (
      previous
      && previous.bulb_id === session.bulb_id
      && previous.position === session.position
      && matches(
        session.started_at - estimatedOff(previous),
        1
      )
    ) {
      // The condition above confirms that this group exists.
      group!.push(session);
    } else {
      groups.push([session]);
    }
  }

  const results: MorseMessage[] = [];

  // Keep the source bulb and position with the message.
  let current: MorseMessage | undefined;

  // Save the current message only if its full time range fits
  // inside the requested range.
  //
  // A message crossing a query boundary is not returned as a
  // shortened message.
  function finishMessage(): void {
    if (
      current
      && current.start_time >= startTime
      && current.start_time < endTime
      && current.end_time <= endTime
    ) {
      results.push({
        start_time: current.start_time,
        end_time: current.end_time,
        message: current.message,
        bulb_id: current.bulb_id,
        position: current.position,
      });
    }

    current = undefined;
  }

  for (let index = 0; index < groups.length; index++) {
    const group = groups[index]!;
    const first = group[0]!;
    const last = group.at(-1)!;

    const previous = groups[index - 1]?.at(-1);
    const next = groups[index + 1]?.[0];

    let code = '';
    let valid = true;

    // Convert every pulse in this group into a dot or a dash.
    for (const session of group) {
      const duration =
        estimatedOff(session) - session.started_at;

      if (matches(duration, 1)) {
        code += '.';
      } else if (matches(duration, 3)) {
        code += '-';
      } else {
        valid = false;
      }

      // Reject inconsistent or future heartbeat times.
      if (
        session.last_seen_at < session.started_at
        || session.last_seen_at > now
      ) {
        valid = false;
      }
    }

    // Overlapping records cannot represent clean on/off pulses.
    if (
      previous
      && first.started_at < estimatedOff(previous)
    ) {
      valid = false;
    }

    if (
      next
      && next.started_at < estimatedOff(last)
    ) {
      valid = false;
    }

    // If another group follows, there must be enough darkness
    // to separate the two letters.
    const minimumLetterGap =
      UNIT_MS * 3 * (1 - TOLERANCE);

    if (
      next
      && next.started_at - estimatedOff(last)
      < minimumLetterGap
    ) {
      valid = false;
    }

    // Look up the entire pattern.
    // Unknown patterns are not decoded as a shorter valid prefix.
    const letter = alphabet[code];

    if (!valid || !letter) {
      finishMessage();
      continue;
    }

    // If there is no later session, wait until the longest
    // accepted word gap has passed.
    //
    // Otherwise, the sender might still be sending this sentence.
    if (
      !next
      && now - estimatedOff(last) <= MESSAGE_GAP_MS
    ) {
      const gap = current
        ? first.started_at - current.end_time
        : Infinity;

      const continuesCurrentMessage =
        current
        && current.bulb_id === first.bulb_id
        && current.position === first.position
        && (matches(gap, 3) || matches(gap, 7));

      if (continuesCurrentMessage) {
        // Do not return the prefix of an unfinished message.
        current = undefined;
      } else {
        finishMessage();
      }

      continue;
    }

    const gap = current
      ? first.started_at - current.end_time
      : Infinity;

    const sameBulb =
      current?.bulb_id === first.bulb_id
      && current?.position === first.position;

    if (
      current
      && sameBulb
      && (matches(gap, 3) || matches(gap, 7))
    ) {
      // A word gap adds a space.
      // A letter gap joins the next letter without a space.
      const separator = matches(gap, 7) ? ' ' : '';

      current.message += separator + letter;
      current.end_time = estimatedOff(last);
    } else {
      // A different bulb or an unrelated gap starts a new message.
      finishMessage();

      current = {
        start_time: first.started_at,
        end_time: estimatedOff(last),
        message: letter,
        bulb_id: first.bulb_id,
        position: first.position
      };
    }
  }

  // Save any completed message remaining after the loop.
  finishMessage();

  return results;
}
