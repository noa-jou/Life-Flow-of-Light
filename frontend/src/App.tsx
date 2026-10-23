import { useEffect, useState } from 'react';
import './App.css';
import BulbPanel from './BulbPanel';

type PanelId = 1 | 2 | 3;
type Layout = '1' | '2' | '3' | '12' | '13' | '23';
type Language = 'en' | 'zh-Hant';

// Keep all interface text together so both languages use the same structure.
const translations = {
  en: {
    appName: 'Life Flow of Light',
    languageLabel: 'Language',
    expand: 'Expand',
    collapse: 'Collapse',
    panels: {
      1: 'Bulbs',
      2: 'House',
      3: 'History',
    },
  },
  'zh-Hant': {
    appName: '歲月流明',
    languageLabel: '語言',
    expand: '展開',
    collapse: '收合',
    panels: {
      1: '燈泡',
      2: '屋子',
      3: '歷史',
    },
  },
};

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

  // Select the text dictionary for the current language.
  const text = translations[language];

  // Synchronize browser metadata with the selected interface language.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translations[language].appName;
  }, [language]);

  function togglePanel(panelId: PanelId) {
    setLayout((previousLayout) => {
      return transitions[previousLayout][panelId];
    });
  }

  return (
    <div className="app-shell">
      <header className="app-toolbar">
        {/* Display the project name in the selected language. */}
        <h1 className="app-title">{text.appName}</h1>
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
                className={`panel ${isOpen ? 'is-open' : 'is-collapsed'} ${
                  panelId === 1 ? 'panel-Bulbs' : ''
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

                    <span className="panel-action" aria-hidden="true">
                      {action}
                    </span>
                  </button>
                </h2>

                <div
                  id={contentId}
                  className="panel-content"
                  hidden={!isOpen && panelId !== 1}
                >
                  {panelId === 1 && (
                    <BulbPanel expanded={isOpen} language={language} />
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