import { useEffect, useState } from 'react';
import BulbPanel from './bulb/BulbPanel';
import HousePanel from './house/HousePanel';
import { appText, type Language } from './i18n';
import { useBulbHeartbeats } from './house/useBulbHeartbeats';
import DialogProvider from './components/Dialog';
import HistoryPanel from './history/HistoryPanel';
import { useLiveTimeline } from './history/useLiveTimeline';
import HistoryLiveHeader from './history/HistoryLiveHeader';

import './App.css';

type PanelId = 1 | 2 | 3;
type Layout = '1' | '2' | '3' | '12' | '13' | '23';

// Panel order stays fixed regardless of language or layout.
const panelIds: PanelId[] = [1, 2, 3];

// Each entry maps the current layout and clicked panel to the next layout.
const transitions: Record<Layout, Record<PanelId, Layout>> = {
  '1': {
    1: '23',
    2: '12',
    3: '13',
  },
  '2': {
    1: '12',
    2: '13',
    3: '23',
  },
  '3': {
    1: '13',
    2: '23',
    3: '12',
  },
  '12': {
    1: '2',
    2: '1',
    3: '23',
  },
  '13': {
    1: '3',
    2: '23', // Opening House closes Bulbs.
    3: '1',
  },
  '23': {
    1: '12',
    2: '3',
    3: '2',
  },
};

export default function App() {
  const [layout, setLayout] = useState<Layout>('23');

  // Start in English whenever the page is loaded.
  const [language, setLanguage] = useState<Language>('en');

  // Increase this number when bulb data changes.
  // House uses it as a signal to fetch the latest installation data.
  const [bulbRevision, setBulbRevision] = useState(0);

  // Share one heartbeat manager between House and Bulbs.
  const heartbeats = useBulbHeartbeats();

  // Share one timeline between the header and the collapsed view.
  const timeline = useLiveTimeline(heartbeats.lights);

  // Select the text dictionary for the current language.
  const text = appText[language];

  // Synchronize browser metadata with the selected interface language.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = appText[language].appName;
  }, [language]);

  function togglePanel(panelId: PanelId) {
    const nextLayout = transitions[layout][panelId];

    const houseWasOpen = layout.includes('2');
    const houseWillBeOpen = nextLayout.includes('2');

    // Turn off all lights only when House changes from open to collapsed.
    if (houseWasOpen && !houseWillBeOpen) {
      heartbeats.stopLight('living_room');
      heartbeats.stopLight('bedroom');
      heartbeats.stopLight('bathroom');
    }

    setLayout(nextLayout);
  }

  return (
    <DialogProvider language={language}>
      <div className="app-shell">
        <header className="app-toolbar">
          {/* Display the project name in the selected language. */}
          <h1 className="app-title">{text.appName}</h1>

          <div className="app-notices">
            <p>{text.singleClientWarning}</p>
            <p>{text.reloadWarning}</p>
          </div>

          <label htmlFor="language-select">
            {text.languageLabel}
          </label>

          <select
            id="language-select"
            value={language}
            onChange={(event) => {
              const nextLanguage = event.target.value;

              // Validate the browser's string value before updating state.
              if (nextLanguage === 'en' || nextLanguage === 'zh-Hant') {
                setLanguage(nextLanguage);
              }
            }}
          >
            <option value="en" lang="en">
              English
            </option>

            <option value="zh-Hant" lang="zh-Hant">
              繁體中文
            </option>
          </select>
        </header>

        <main className="panel-viewport" aria-label={text.appName}>
          <div className="folding-panels">
            {panelIds.map((panelId) => {
              const isOpen = layout.includes(String(panelId));
              const title = text.panels[panelId];
              const action = isOpen ? text.collapse : text.expand;

              const contentId = `panel-content-${panelId}`;
              const titleId = `panel-title-${panelId}`;

              return (
                <section
                  key={panelId}
                  className={`panel ${isOpen ? 'is-open' : 'is-collapsed'} ${panelId === 1 ? 'panel-bulbs' :
                    panelId === 2 ? 'panel-house' :
                      'panel-history'
                    }`}
                  aria-labelledby={titleId}
                >
                  <h2 className="panel-heading">
                    <button
                      type="button"
                      className="panel-toggle"
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      aria-label={`${action} ${title}`}
                      onClick={() => togglePanel(panelId)}
                    >
                      <span id={titleId} className="panel-title">
                        {title}
                      </span>

                      {panelId === 3 && isOpen && (
                        <HistoryLiveHeader
                          language={language}
                          timeline={timeline}
                        />
                      )}

                      <span className="panel-action" aria-hidden="true">
                        {action}
                      </span>
                    </button>
                  </h2>

                  <div
                    id={contentId}
                    className="panel-content"
                  >
                    {panelId === 1 && (
                      <BulbPanel
                        expanded={isOpen}
                        language={language}
                        heartbeats={heartbeats}
                        fullWidth={layout === '1'}
                        onBulbsChanged={() => {
                          setBulbRevision((current) => current + 1);
                        }}
                      />
                    )}

                    {panelId === 2 && (
                      <HousePanel
                        expanded={isOpen}
                        language={language}
                        fullWidth={layout === '2'}
                        bulbRevision={bulbRevision}
                        heartbeats={heartbeats}
                      />
                    )}

                    {panelId === 3 && (
                      <HistoryPanel
                        expanded={isOpen}
                        language={language}
                        timeline={timeline}
                      />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </DialogProvider>
  );
}