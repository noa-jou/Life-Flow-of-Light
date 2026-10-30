import type { Language } from '../i18n';
import { historyText } from './history-text';
import type { useLiveTimeline } from './useLiveTimeline';
import './HistoryPanel.css';
import { useState } from 'react';
import { createDefaultDateRange } from './history-dates';

type Props = {
  expanded: boolean;
  language: Language;
  timeline: ReturnType<typeof useLiveTimeline>;
};

type GroupBy = 'day' | 'position';

const positions = [
  'living_room',
  'bedroom',
  'bathroom',
] as const;

export default function HistoryPanel({
  expanded,
  language,
  timeline,
}: Props) {
  const text = historyText[language];

  const [dateRange, setDateRange] = useState(createDefaultDateRange);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const invalidDateRange =
    dateRange.from !== '' &&
    dateRange.to !== '' &&
    dateRange.from > dateRange.to;

  // The clock and the top cell use the same second.
  const localTime = new Date(
    timeline.second * 1000,
  ).toLocaleTimeString(
    language === 'en' ? 'en-GB' : 'zh-TW',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    },
  );

  if (expanded) {
    return (
      <div className="history-expanded">
        <div className="history-toolbar">
          <div className="history-filters">
            <label className="history-filter">
              <span>{text.from}</span>

              <input
                type="date"
                value={dateRange.from}
                required
                aria-invalid={invalidDateRange}
                aria-describedby={
                  invalidDateRange ? 'history-date-error' : undefined
                }
                onChange={(event) => {
                  const from = event.target.value;

                  setDateRange((current) => ({
                    ...current,
                    from,
                  }));
                }}
              />
            </label>

            <label className="history-filter">
              <span>{text.to}</span>

              <input
                type="date"
                value={dateRange.to}
                required
                aria-invalid={invalidDateRange}
                aria-describedby={
                  invalidDateRange ? 'history-date-error' : undefined
                }
                onChange={(event) => {
                  const to = event.target.value;

                  setDateRange((current) => ({
                    ...current,
                    to,
                  }));
                }}
              />
            </label>

            <label className="history-filter">
              <span>{text.by}</span>

              <select
                value={groupBy}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === 'day' || value === 'position') {
                    setGroupBy(value);
                  }
                }}
              >
                <option value="day">{text.day}</option>
                <option value="position">{text.position}</option>
              </select>
            </label>
          </div>
        </div>

        {invalidDateRange && (
          <p
            id="history-date-error"
            className="history-date-error"
            role="alert"
          >
            {text.invalidDateRange}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="history-compact">
      <div className="history-local-clock">
        <span className="history-local-clock-label">
          {text.localTime}
        </span>

        <time className="history-local-clock-value">
          {localTime}
        </time>
      </div>

      <p className="history-compact-hint">
        {text.secondHint}
      </p>

      <div
        className="history-live-columns"
        role="group"
        aria-label={text.liveTimeline}
      >
        {positions.map((position) => (
          <div className="history-live-column" key={position}>
            <div className="history-live-track" aria-hidden="true">
              {timeline.cells.map((cell) => (
                <span
                  key={cell.second}
                  className={`history-live-cell ${cell.on[position] ? 'is-on' : ''
                    }`}
                />
              ))}
            </div>

            <span className="history-live-label">
              {text[position]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}