import { useEffect, useRef, useState } from 'react';

import {
  createLamp,
  getLamps,
  installLamp,
  isPosition,
  positions,
  renameLamp,
  uninstallLamp,
} from './lamp-api';

import type { Lamp, Position } from './lamp-api';
import { lampText } from './lamp-text';
import type { Language } from './lamp-text';

import './LampPanel.css';

type Props = {
  expanded: boolean;
  language: Language;
};

type Editor = {
  id: number;
  name: string;
  position: Position | '';
};

type Problem = {
  phase: 'load' | 'write' | 'refresh';
  message: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

export default function LampPanel({ expanded, language }: Props) {
  const text = lampText[language];

  const [lamps, setLamps] = useState<Lamp[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  // A ref changes immediately and prevents overlapping requests.
  const requestLocked = useRef(true);

  useEffect(() => {
    const controller = new AbortController();

    getLamps(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setLamps(data);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setProblem({
          phase: 'load',
          message: errorMessage(error),
        });
      })
      .finally(() => {
        if (controller.signal.aborted) return;

        requestLocked.current = false;
        setBusy(false);
      });

    // Cancel this load if the component is removed.
    // This also supports React's development StrictMode checks.
    return () => controller.abort();
  }, []);

  // Copy before sorting so React state is never mutated in place.
  const sortedLamps = [...lamps].sort((a, b) => {
    const groupDifference =
      Number(a.position === null) - Number(b.position === null);

    return groupDifference || a.id - b.id;
  });

  const installed = sortedLamps.filter((lamp) => lamp.position !== null);
  const idle = sortedLamps.filter((lamp) => lamp.position === null);

  // Filtering preserves the English alphabetical order in positions.
  const availablePositions = positions.filter((position) => {
    return !lamps.some((lamp) => lamp.position === position);
  });

  const controlsDisabled = busy || !ready;

  async function synchronize(change?: () => Promise<unknown>) {
    if (requestLocked.current) return;

    requestLocked.current = true;
    setBusy(true);
    setProblem(null);

    let changeSaved = false;

    try {
      if (change) {
        await change();
        changeSaved = true;
      }

      // Always read the complete list after a successful change.
      const data = await getLamps();

      setLamps(data);
      setReady(true);
      setEditor(null);
    } catch (error: unknown) {
      // Keep the last list visible, but block edits until it is refreshed.
      setReady(false);
      setProblem({
        phase: changeSaved ? 'refresh' : change ? 'write' : 'load',
        message: errorMessage(error),
      });
    } finally {
      requestLocked.current = false;
      setBusy(false);
    }
  }

  function beginEditing(lamp: Lamp) {
    if (!expanded || controlsDisabled || editor?.id === lamp.id) return;

    setEditor({
      id: lamp.id,
      name: lamp.name,
      position: lamp.position ?? availablePositions.at(0) ?? '',
    });
  }

  function confirmRename(lamp: Lamp) {
    if (!editor || editor.id !== lamp.id || controlsDisabled) return;

    const name = editor.name.trim();

    // Match the backend's Unicode code-point length check.
    if ([...name].length < 1 || [...name].length > 20) {
      window.alert(text.invalidName);
      return;
    }

    if (name === lamp.name) return;

    const confirmed = window.confirm(
      `${text.renameQuestion}\n\n${lamp.name} → ${name}`,
    );

    if (confirmed) {
      void synchronize(() => renameLamp(lamp.id, name));
    }
  }

    function confirmPosition(lamp: Lamp, position: Position | '') {
    if (controlsDisabled) return;

    if (lamp.position !== null) {
        // Label the lamp name and its current installation position.
        const confirmed = window.confirm(
        `${text.uninstallQuestion}\n\n` +
            `${text.name}: ${lamp.name}\n` +
            `${text.dialogPosition}: ${text.positions[lamp.position]}`,
        );

        if (confirmed) {
        void synchronize(() => uninstallLamp(lamp.id));
        }

        return;
    }

    if (position === '' || !availablePositions.includes(position)) return;

    // Label the lamp name and the proposed installation position.
    const confirmed = window.confirm(
        `${text.installQuestion}\n\n` +
        `${text.name}: ${lamp.name}\n` +
        `${text.dialogPosition}: ${text.positions[position]}`,
    );

    if (confirmed) {
        void synchronize(() => installLamp(lamp.id, position));
    }
    }

  // Translate known backend failures without exposing technical messages.
  let detail = '';

  if (problem?.message === 'Position is already occupied.') {
    detail = text.occupied;
  } else if (
    problem?.message === 'Lamp is already installed at another position.'
  ) {
    detail = text.alreadyInstalled;
  } else if (problem?.message === 'Lamp not found.') {
    detail = text.missing;
  } else if (
    problem?.message ===
    'Turn off this lamp and wait more than one second before uninstalling it.'
  ) {
    detail = text.activeLamp;
  }

  function renderLamp(lamp: Lamp) {
    const editing = editor?.id === lamp.id;
    const status =
      lamp.position === null ? text.idle : text.positions[lamp.position];

    // Use an empty string when no installation position is available.
    const selectedPosition =
    lamp.position ??
    (editing &&
    editor.position !== '' &&
    availablePositions.includes(editor.position)
        ? editor.position
        : availablePositions.at(0) ?? '');

    const rowClass =
      `lamp-row ${lamp.position === null ? 'is-idle' : 'is-installed'}` +
      (expanded && editing ? ' is-editing' : '');

    if (!expanded) {
      return (
        <li
          key={lamp.id}
          className={rowClass}
          title={status}
          tabIndex={0}
          aria-label={`${lamp.name}: ${status}`}
        >
          <span className="lamp-compact-name">{lamp.name}</span>
        </li>
      );
    }

    return (
      <li
        key={lamp.id}
        className={rowClass}
        onClick={() => beginEditing(lamp)}
      >
        <div className="lamp-name-cell">
          {editing ? (
            <form
              className="lamp-inline-controls"
              onSubmit={(event) => {
                event.preventDefault();
                confirmRename(lamp);
              }}
            >
              <input
                aria-label={text.name}
                value={editor.name}
                disabled={controlsDisabled}
                onChange={(event) => {
                  const name = event.target.value;

                  setEditor((current) =>
                    current ? { ...current, name } : current,
                  );
                }}
              />

              <button
                type="submit"
                disabled={
                  controlsDisabled || editor.name.trim() === lamp.name
                }
              >
                {text.confirmChange}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="lamp-name-button"
              disabled={controlsDisabled}
              onClick={() => beginEditing(lamp)}
            >
              {lamp.name}
            </button>
          )}
        </div>

        <code className="lamp-serial" aria-label={text.serial}>
          {lamp.serial_number}
        </code>

        <div className="lamp-inline-controls">
        <select
            aria-label={`${text.position}: ${lamp.name}`}
            value={selectedPosition}
            disabled={
            controlsDisabled ||
            lamp.position !== null ||
            availablePositions.length === 0
            }
            onChange={(event) => {
            const position = event.target.value;

            if (!isPosition(position)) return;

            // Selecting a position also selects this row for editing.
            // Preserve the name draft if this row is already being edited.
            setEditor((current) => ({
                id: lamp.id,
                name: current?.id === lamp.id ? current.name : lamp.name,
                position,
            }));
            }}
        >
            {lamp.position !== null ? (
            <option value={lamp.position}>
                {text.positions[lamp.position]}
            </option>
            ) : availablePositions.length === 0 ? (
            <option value="">{text.noPositions}</option>
            ) : (
            availablePositions.map((position) => (
                <option key={position} value={position}>
                {text.positions[position]}
                </option>
            ))
            )}
        </select>

        {/* Keep position actions visible without requiring a row selection. */}
        <button
            type="button"
            disabled={
            controlsDisabled ||
            (lamp.position === null && selectedPosition === '')
            }
            onClick={(event) => {
            // Do not also trigger the row's name-editing action.
            event.stopPropagation();
            confirmPosition(lamp, selectedPosition);
            }}
        >
            {lamp.position === null ? text.confirm : text.uninstall}
        </button>
        </div>
      </li>
    );
  }

  return (
    <div
      className={`lamp-manager ${expanded ? 'is-expanded' : 'is-compact'}`}
      aria-busy={busy}
    >
      {busy && (
        <p className="lamp-message" role="status">
          {ready ? text.saving : text.loading}
        </p>
      )}

      {problem && (
        <div className="lamp-error" role="alert">
          <p>
            {problem.phase === 'refresh'
              ? text.refreshFailed
              : problem.phase === 'write'
                ? text.writeFailed
                : text.loadFailed}
          </p>

          {detail && <p>{detail}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={() => void synchronize()}
          >
            {text.reload}
          </button>
        </div>
      )}

      <div className="lamp-list-scroll">
        {expanded && (
          <div className="lamp-column-headings">
            <span>{text.name}</span>
            <span>{text.serial}</span>
            <span>{text.position}</span>
          </div>
        )}
        {ready && lamps.length === 0 && (
          <p className="lamp-message">{text.empty}</p>
        )}

        {installed.length > 0 && (
          <ul className="lamp-group">
            {installed.map(renderLamp)}
          </ul>
        )}

        {idle.length > 0 && (
          <ul className="lamp-group lamp-idle-group">
            {idle.map(renderLamp)}
          </ul>
        )}
      </div>

      {expanded && (
        <footer className="lamp-footer">
          <button
            type="button"
            className="lamp-add-button"
            disabled={controlsDisabled}
            onClick={() => void synchronize(createLamp)}
          >
            {text.add}
          </button>
        </footer>
      )}
    </div>
  );
}