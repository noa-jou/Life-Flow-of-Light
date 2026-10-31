import type { Language } from '../i18n';
import type { LightSession } from './history-api';
import { getSessionBar } from './history-bars';
import { historyText } from './history-text';
import './HistoryGantt.css';
import HistoryScroll from './HistoryScroll';

type Props = {
  language: Language;
  dates: string[];
  groupBy: 'day' | 'position';
  sessions: LightSession[];
  zoom: number;
};

const positions = ['living_room', 'bedroom', 'bathroom'] as const;

export default function HistoryGantt({
  language,
  dates,
  groupBy,
  sessions,
  zoom,
}: Props) {

  const text = historyText[language];

  // Keep tick spacing readable as the timeline grows wider.
  const tickMinutes = 240 / zoom;

  const ticks = Array.from(
    { length: Math.round(1440 / tickMinutes) + 1 },
    (_, index) => index * tickMinutes,
  );

  function formatTick(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return (
      `${String(hours).padStart(2, '0')}:` +
      String(remainingMinutes).padStart(2, '0')
    );
  }

  // Each row identifies both a position and a calendar date.
  const charts =
    groupBy === 'day'
      ? dates.map((date) => ({
        id: date,
        title: date,
        rows: positions.map((position) => ({
          id: position,
          label: text[position],
          position,
          date,
        })),
      }))
      : positions.map((position) => ({
        id: position,
        title: text[position],
        rows: dates.map((date) => ({
          id: date,
          label: date,
          position,
          date,
        })),
      }));

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString(
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
  }

  if (dates.length === 0) {
    return null;
  }

  return (
    <div className="history-gantt-list">
      {charts.map((chart) => (
        <section className="history-gantt-chart" key={chart.id}>
          <h3 className="history-gantt-title">{chart.title}</h3>

          <HistoryScroll
            language={language}
            title={chart.title}
            zoom={zoom}
          >
            <div
              className="history-gantt-grid"
              style={{
                width: `${zoom * 100}%`,
                minWidth: `${460 * zoom}px`,
              }}
            >
              <div className="history-gantt-axis">
                {ticks.map((minutes) => (
                  <span
                    className="history-gantt-tick"
                    key={minutes}
                    style={{ left: `${(minutes / 1440) * 100}%` }}
                  >
                    {formatTick(minutes)}
                  </span>
                ))}
              </div>

              {chart.rows.map((row) => (
                <div className="history-gantt-row" key={row.id}>
                  <span className="history-gantt-row-label">
                    {row.label}
                  </span>

                  <div
                    className="history-gantt-row-track"
                    style={{
                      backgroundSize: `${(tickMinutes / 1440) * 100}% 100%`,
                    }}
                  >
                    {sessions
                      .filter(
                        (session) => session.position === row.position,
                      )
                      .map((session) => {
                        const bar = getSessionBar(session, row.date);

                        if (bar === null) return null;

                        const description =
                          `${text[row.position]}: ` +
                          `${formatTime(session.started_at)} → ` +
                          `${formatTime(session.last_seen_at)}`;

                        return (
                          <span
                            key={session.id}
                            className="history-gantt-bar"
                            role="img"
                            aria-label={description}
                            title={description}
                            style={{
                              left: `min(${bar.left}%, calc(100% - 2px))`,
                              width: `${bar.width}%`,
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </HistoryScroll>
        </section>
      ))}
    </div>
  );
}