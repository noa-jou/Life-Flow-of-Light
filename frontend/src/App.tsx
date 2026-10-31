import { useEffect, useState } from 'react';
import BulbPanel from './bulb/BulbPanel';
import HousePanel from './house/HousePanel';
import { appText, type Language } from './i18n';
import { useBulbHeartbeats } from './house/useBulbHeartbeats';
import DialogProvider from './dialog/Dialog';
import HistoryPanel from './history/HistoryPanel';
import { useLiveTimeline } from './history/useLiveTimeline';
import HistoryLiveHeader from './history/HistoryLiveHeader';
import { useDialog } from './dialog/dialog-context';
import MorsePanel from './morse/MorsePanel';

import './App.css';

type PanelId = 1 | 2 | 3 | 4;

const panelIds: PanelId[] = [1, 2, 3, 4];

export default function App() {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <DialogProvider language={language}>
      <AppContent
        language={language}
        onLanguageChange={setLanguage}
      />
    </DialogProvider>
  );
}

type AppContentProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
};

function AppContent({
  language,
  onLanguageChange,
}: AppContentProps) {
  const [openPanels, setOpenPanels] = useState<PanelId[]>([2, 3]);
  const { choose } = useDialog();

  // Keep the existing full-width checks working.
  const layout = openPanels.join('');

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

  async function togglePanel(panelId: PanelId) {
    const isOpen = openPanels.includes(panelId);
    let nextPanels: PanelId[];

    if (isOpen && openPanels.length === 1) {
      const answer = await choose(
        text.chooseNextPanel,
        panelIds
          .filter((id) => id !== panelId)
          .map((id) => ({
            value: String(id),
            label: text.panels[id],
          })),
      );

      const selectedPanel = panelIds.find(
        (id) => id !== panelId && String(id) === answer,
      );

      // Cancel leaves the current layout and lights unchanged.
      if (selectedPanel === undefined) return;

      nextPanels = [selectedPanel];
    } else if (isOpen) {
      nextPanels = openPanels.filter((id) => id !== panelId);
    } else {
      // Keep the most recently opened panel and open the requested one.
      nextPanels = [...openPanels.slice(-1), panelId];
    }

    const houseWasOpen = openPanels.includes(2);
    const houseWillBeOpen = nextPanels.includes(2);

    if (houseWasOpen && !houseWillBeOpen) {
      heartbeats.stopLight('living_room');
      heartbeats.stopLight('bedroom');
      heartbeats.stopLight('bathroom');
    }

    setOpenPanels(nextPanels);
  }

  return (
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
              onLanguageChange(nextLanguage);
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
            const isOpen = openPanels.includes(panelId);
            const title = text.panels[panelId];
            const action = isOpen ? text.collapse : text.expand;

            const contentId = `panel-content-${panelId}`;
            const titleId = `panel-title-${panelId}`;

            return (
              <section
                key={panelId}
                className={`panel ${isOpen ? 'is-open' : 'is-collapsed'} ${panelId === 1
                  ? 'panel-bulbs'
                  : panelId === 2
                    ? 'panel-house'
                    : panelId === 3
                      ? 'panel-history'
                      : 'panel-morse'
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
                    onClick={() => {
                      void togglePanel(panelId);
                    }}
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
                      bulbRevision={bulbRevision}
                    />
                  )}

                  {panelId === 4 && (
                    <MorsePanel
                      expanded={isOpen}
                      language={language}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}