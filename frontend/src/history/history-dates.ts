export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function createDefaultDateRange() {
    const today = new Date();
    const threeDaysAgo = new Date(today);

    // Move back three calendar days in the local time zone.
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return {
        from: formatLocalDate(threeDaysAgo),
        to: formatLocalDate(today),
    };
}

export function getDatesInRange(from: string, to: string): string[] {
  if (!from || !to || from > to) {
    return [];
  }

  // Use local noon to walk through calendar dates.
  const current = new Date(`${from}T12:00:00`);
  const last = new Date(`${to}T12:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime())) {
    return [];
  }

  const dates: string[] = [];

  while (current <= last) {
    dates.push(formatLocalDate(current));

    // Move forward by one calendar day.
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function getQueryTimeRange(from: string, to: string) {
  // Interpret the selected dates in the user's local timezone.
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  // The API excludes the end boundary.
  // Use the next day's midnight to include the entire final day.
  end.setDate(end.getDate() + 1);

  return {
    startTime: start.getTime(),
    endTime: end.getTime(),
  };
}