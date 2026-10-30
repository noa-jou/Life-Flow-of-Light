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