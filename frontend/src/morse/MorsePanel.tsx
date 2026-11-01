import { useEffect, useRef, useState } from 'react';
import type { Language } from '../i18n';
import { morseText, guideText } from './morse-text';
import MorseLessons, { type LessonId } from './MorseLessons';
import './MorsePanel.css';
import { useDialog } from '../dialog/dialog-context';
import { getBulbs, type Bulb } from '../bulb/bulb-api';
import {
  findMorseMessages,
  type MorseMessage,
} from './morse-api';


type ColumnId = 'time' | 'position' | 'bulb' | 'message';

type ColumnWidths = Partial<Record<ColumnId, number>>;

// Format local time for a datetime-local input.
function formatLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// Compare calendar dates in the user's local timezone.
function isSameLocalDay(start: number, end: number): boolean {
  const from = new Date(start);
  const to = new Date(end);

  return (
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate()
  );
}

type Props = {
  expanded: boolean;
  language: Language;
  fullWidth: boolean;
};

export default function MorsePanel({
  expanded,
  language,
  fullWidth,
}: Props) {
  const text = morseText[language];

  const { inform } = useDialog();

  const [messages, setMessages] = useState<MorseMessage[]>([]);
  const [bulbs, setBulbs] = useState<Bulb[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [newestFirst, setNewestFirst] = useState(false);

  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});

  const [wasExpanded, setWasExpanded] = useState(expanded);

  if (wasExpanded !== expanded) {
    setWasExpanded(expanded);

    if (!expanded) {
      setColumnWidths({});
    }
  }

  const [resultsWidth, setResultsWidth] = useState(0);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const resizeRef = useRef<{
    column: ColumnId;
    pointerId: number;
    startX: number;
    startWidth: number;
    minimum: number;
  } | null>(null);

  useEffect(() => {
    if (!expanded) return;

    const element = resultsRef.current;
    if (!element) return;

    element.scrollLeft = 0;

    const observer = new ResizeObserver(() => {
      setResultsWidth(element.clientWidth);
    });

    observer.observe(element);
    setResultsWidth(element.clientWidth);

    return () => observer.disconnect();
  }, [expanded]);

  const searchController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      searchController.current?.abort();
    };
  }, []);

  const [dateRange, setDateRange] = useState(() => {
    const from = new Date();
    from.setDate(from.getDate() - 3);
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setHours(23, 59, 59, 0);

    return {
      from: formatLocalInput(from),
      to: formatLocalInput(to),
    };
  });

  function changeDateRange(
    field: 'from' | 'to',
    value: string,
  ) {
    setDateRange((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleFind() {
    // Prevent repeated clicks while a search is running.
    if (searchController.current !== null) return;

    const start = new Date(dateRange.from).getTime();
    const end = new Date(dateRange.to).getTime();

    if (
      !dateRange.from ||
      !dateRange.to ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end - start < 60_000
    ) {
      void inform(text.invalidDateRange);
      return;
    }

    const controller = new AbortController();
    searchController.current = controller;

    setSearchStatus('loading');
    setMessages([]);
    setBulbs([]);

    try {
      const [foundMessages, currentBulbs] = await Promise.all([
        findMorseMessages(start, end, controller.signal),
        getBulbs(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      setMessages(foundMessages);
      setBulbs(currentBulbs);
      setSearchStatus('success');
    } catch {
      if (controller.signal.aborted) return;

      // Cancel any remaining requests after a failure.
      controller.abort();
      setSearchStatus('error');
      void inform(text.searchFailed);
    } finally {
      if (searchController.current === controller) {
        searchController.current = null;
      }
    }
  }

  const isFull = expanded && fullWidth;

  const [activeLesson, setActiveLesson] =
    useState<LessonId | null>(() => (isFull ? 1 : null));

  const [wasFull, setWasFull] = useState(isFull);
  const showSourceColumns = isFull && activeLesson === null;

  const visibleColumns: ColumnId[] = showSourceColumns
    ? ['time', 'position', 'bulb', 'message']
    : ['time', 'message'];

  const widths: Record<ColumnId, number> = {
    time: columnWidths.time ?? 200,
    position: columnWidths.position ?? 110,
    bulb: columnWidths.bulb ?? 100,
    message: 0,
  };

  const otherColumnsWidth =
    widths.time +
    (showSourceColumns ? widths.position + widths.bulb : 0);

  widths.message =
    columnWidths.message ??
    Math.max(160, resultsWidth - otherColumnsWidth);

  const tableWidth = visibleColumns.reduce(
    (total, column) => total + widths[column],
    0,
  );

  function changeColumnWidth(column: ColumnId, width: number) {
    setColumnWidths((current) => ({
      ...current,
      [column]: width,
    }));
  }

  function renderResizeHandle(column: ColumnId) {
    const englishLabel = {
      time: 'Local time',
      position: 'Position',
      bulb: 'Bulb',
      message: 'Message',
    }[column];

    const label = {
      time: text.localTime,
      position: text.position,
      bulb: text.bulb,
      message: text.message,
    }[column];

    // Measure the English heading using the actual header font.
    function getMinimum(element: HTMLElement): number {
      const measure = element.querySelector<HTMLElement>(
        '.morse-column-measure',
      );

      return Math.ceil(measure?.getBoundingClientRect().width ?? 0) + 32;
    }

    return (
      <span
        className="morse-column-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label={
          language === 'en'
            ? `Resize ${label} column`
            : `調整${label}欄寬`
        }
        aria-valuenow={Math.round(widths[column])}
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.button !== 0) return;

          event.preventDefault();
          event.stopPropagation();

          const minimum = getMinimum(event.currentTarget);

          resizeRef.current = {
            column,
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth: widths[column],
            minimum,
          };

          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const resize = resizeRef.current;

          if (
            !resize ||
            resize.column !== column ||
            resize.pointerId !== event.pointerId
          ) {
            return;
          }

          changeColumnWidth(
            column,
            Math.max(
              resize.minimum,
              resize.startWidth + event.clientX - resize.startX,
            ),
          );
        }}
        onPointerUp={(event) => {
          if (resizeRef.current?.pointerId !== event.pointerId) return;

          resizeRef.current = null;

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          resizeRef.current = null;
        }}
        onLostPointerCapture={() => {
          resizeRef.current = null;
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
          }

          event.preventDefault();

          const minimum = getMinimum(event.currentTarget);
          const change = event.key === 'ArrowRight' ? 10 : -10;

          changeColumnWidth(
            column,
            Math.max(minimum, widths[column] + change),
          );
        }}
      >
        <span className="morse-column-measure" aria-hidden="true">
          {englishLabel}
          {column === 'time' && <span> ↑</span>}
        </span>
      </span>
    );
  }

  // Adjust the selection only when the layout mode changes.
  if (wasFull !== isFull) {
    setWasFull(isFull);

    if (isFull && activeLesson === null) {
      setActiveLesson(1);
    }
  }

  const bulbNames = new Map(
    bulbs.map((bulb) => [bulb.id, bulb.name]),
  );

  const displayedMessages = newestFirst
    ? [...messages].reverse()
    : messages;

  const dateTimeFormatter = new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'zh-TW',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    },
  );

  const timeFormatter = new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'zh-TW',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    },
  );

  const resultNotice =
    searchStatus === 'loading'
      ? text.searching
      : searchStatus === 'error'
        ? text.searchFailed
        : searchStatus === 'idle'
          ? text.notSearched
          : text.noData;

  if (!expanded) {
    const guide = guideText[language];

    return (
      <div className="morse-summary">
        <dl className="morse-summary-timing">
          {guide.timing.map(([label, duration]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{duration}</dd>
            </div>
          ))}
        </dl>

        <p>{guide.finish}</p>
      </div>
    );
  }

  return (
    <div
      className={[
        'morse-panel',
        isFull ? 'is-full' : '',
        activeLesson !== null ? 'has-lesson' : '',
      ].filter(Boolean).join(' ')}
    >
      <section
        className="morse-search"
        aria-label={text.condition}
      >
        <div className="morse-conditions">
          <div className="morse-condition-heading">
            <h3>{text.condition}</h3>
            <button
              type="button"
              disabled={searchStatus === 'loading'}
              onClick={() => {
                void handleFind();
              }}
            >
              {searchStatus === 'loading'
                ? text.searching
                : text.find}
            </button>
          </div>

          <div className="morse-date-row">
            <label className="morse-date-field">
              <span>{text.from}</span>
              <input
                type="datetime-local"
                step="1"
                disabled={searchStatus === 'loading'}
                value={dateRange.from}
                onChange={(event) => {
                  changeDateRange('from', event.target.value);
                }}
              />
            </label>

            <label className="morse-date-field">
              <span>{text.to}</span>
              <input
                type="datetime-local"
                step="1"
                disabled={searchStatus === 'loading'}
                value={dateRange.to}
                onChange={(event) => {
                  changeDateRange('to', event.target.value);
                }}
              />
            </label>
          </div>
        </div>

        <div className="morse-results" ref={resultsRef}>
          <table
            className="morse-result-table"
            style={{ width: tableWidth }}
          >
            <colgroup>
              {visibleColumns.map((column) => (
                <col
                  key={column}
                  style={{ width: widths[column] }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  scope="col"
                  aria-sort={newestFirst ? 'descending' : 'ascending'}
                >
                  <button
                    type="button"
                    className="morse-time-sort"
                    title={
                      newestFirst ? text.newestFirst : text.oldestFirst
                    }
                    aria-label={`${text.localTime}: ${newestFirst ? text.oldestFirst : text.newestFirst
                      }`}
                    onClick={() => {
                      setNewestFirst((current) => !current);
                    }}
                  >
                    {text.localTime}
                    <span aria-hidden="true">
                      {newestFirst ? '↓' : '↑'}
                    </span>
                  </button>
                  {renderResizeHandle('time')}
                </th>

                {showSourceColumns && (
                  <>
                    <th scope="col">
                      {text.position}
                      {renderResizeHandle('position')}
                    </th>

                    <th scope="col">
                      {text.bulb}
                      {renderResizeHandle('bulb')}
                    </th>
                  </>
                )}

                <th scope="col">
                  {text.message}
                  {renderResizeHandle('message')}
                </th>
              </tr>
            </thead>

            <tbody>
              {searchStatus === 'success' &&
                displayedMessages.length > 0 ? (
                displayedMessages.map((item) => {
                  const bulbName =
                    bulbNames.get(item.bulb_id) ??
                    `${text.bulb} #${item.bulb_id}`;

                  return (
                    <tr
                      key={[
                        item.position,
                        item.bulb_id,
                        item.start_time,
                        item.end_time,
                      ].join('-')}
                    >
                      <td
                        className="morse-message-time"
                        title={
                          `${dateTimeFormatter.format(item.start_time)} → ` +
                          dateTimeFormatter.format(item.end_time)
                        }
                      >
                        <div>
                          {dateTimeFormatter.format(item.start_time)}
                        </div>
                        <div>
                          → {isSameLocalDay(item.start_time, item.end_time)
                            ? timeFormatter.format(item.end_time)
                            : dateTimeFormatter.format(item.end_time)}
                        </div>
                      </td>

                      {showSourceColumns && (
                        <>
                          <td>{text[item.position]}</td>
                          <td>{bulbName}</td>
                        </>
                      )}

                      <td
                        className="morse-message-text"
                        title={`${text[item.position]} — ${bulbName}`}
                      >
                        {item.message}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showSourceColumns ? 4 : 2}>
                    <span role="status">{resultNotice}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MorseLessons
        language={language}
        activeLesson={activeLesson}
        onLessonChange={setActiveLesson}
      />
    </div>
  );
}