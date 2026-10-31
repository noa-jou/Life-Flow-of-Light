import type { Language } from '../i18n';
import { historyText } from './history-text';
import type { useLiveTimeline } from './useLiveTimeline';
import './HistoryPanel.css';
import { useEffect, useState } from 'react';
import { getBulbs } from '../bulb/bulb-api';
import type { Bulb } from '../bulb/bulb-api';
import {
  createDefaultDateRange,
  getDatesInRange,
} from './history-dates';
import HistoryGantt from './HistoryGantt';
import { useDialog } from '../dialog/dialog-context';
import { useHistorySessions } from './useHistorySessions';

type Props = {
  expanded: boolean;
  language: Language;
  timeline: ReturnType<typeof useLiveTimeline>;
  bulbRevision: number;
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
  bulbRevision,
}: Props) {
  const text = historyText[language];
  const { inform } = useDialog();

  const [dateRange, setDateRange] = useState(createDefaultDateRange);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [newestFirst, setNewestFirst] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [bulbs, setBulbs] = useState<Bulb[]>([]);

  useEffect(() => {
    if (!expanded) return;

    const controller = new AbortController();

    getBulbs(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;

        setBulbs(items);
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        // Keep the history usable with bulb IDs if names cannot be loaded.
        setBulbs([]);
      });

    return () => controller.abort();
  }, [expanded, bulbRevision, dateRange.from, dateRange.to]);

  function changeDate(field: 'from' | 'to', value: string) {
    // Keep the current range when the input is empty or incomplete.
    if (!value) return;

    const nextRange = {
      ...dateRange,
      [field]: value,
    };

    // Reject the change before updating state.
    if (nextRange.from > nextRange.to) {
      void inform(text.invalidDateRange);
      return;
    }

    setDateRange(nextRange);
  }


  const dates = getDatesInRange(dateRange.from, dateRange.to);

  const orderedDates = newestFirst ? [...dates].reverse() : dates;

  const { sessions, loading, failed } = useHistorySessions(
    dateRange.from,
    dateRange.to,
  );

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
                onChange={(event) => {
                  changeDate('from', event.target.value);
                }}
              />
            </label>

            <label className="history-filter">
              <span>{text.to}</span>

              <input
                type="date"
                value={dateRange.to}
                required
                onChange={(event) => {
                  changeDate('to', event.target.value);
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

        <div className="history-toolbar-actions">

          <button
            type="button"
            className="history-tool-button"
            aria-label={text.zoomOut}
            title={text.zoomOut}
            disabled={zoom === 1}
            onClick={() => {
              setZoom((current) => Math.max(1, current / 2));
            }}
          >
            −
          </button>

          <span className="history-zoom-value">{zoom}×</span>

          <button
            type="button"
            className="history-tool-button"
            aria-label={text.zoomIn}
            title={text.zoomIn}
            disabled={zoom === 16}
            onClick={() => {
              setZoom((current) => Math.min(16, current * 2));
            }}
          >
            +
          </button>

          <button
            type="button"
            className="history-tool-button"
            title={text.reverseDateOrder}
            onClick={() => {
              setNewestFirst((current) => !current);
            }}
          >
            {newestFirst ? text.newestFirst : text.oldestFirst}
            {' ↕'}
          </button>

        </div>

        {loading && (
          <p role="status">{text.loadingHistory}</p>
        )}

        {failed && (
          <p role="alert">{text.historyLoadFailed}</p>
        )}

        {!loading && !failed && (
          <HistoryGantt
            language={language}
            dates={orderedDates}
            groupBy={groupBy}
            sessions={sessions}
            bulbs={bulbs}
            zoom={zoom}
          />
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