import { useEffect, useRef, useState } from 'react';

import {
  createBulb,
  deleteBulb,
  getBulbs,
  installBulb,
  isPosition,
  positions,
  renameBulb,
  uninstallBulb,
} from './bulb-api';

import type { Bulb, Position } from './bulb-api';
import { bulbText } from './bulb-text';
import type { Language } from '../i18n';

import './BulbPanel.css';

type Props = {
  expanded: boolean;
  language: Language;
  onBulbsChanged: () => void;
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

export default function BulbPanel({
  expanded,
  language,
  onBulbsChanged,
}: Props) {
  const text = bulbText[language];

  const [bulbs, setBulbs] = useState<Bulb[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  // A ref changes immediately and prevents overlapping requests.
  const requestLocked = useRef(true);

  useEffect(() => {
    const controller = new AbortController();

    getBulbs(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setBulbs(data);
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
  const sortedBulbs = [...bulbs].sort((a, b) => {
    const groupDifference =
      Number(a.position === null) - Number(b.position === null);

    return groupDifference || a.id - b.id;
  });

  const installed = sortedBulbs.filter((bulb) => bulb.position !== null);
  const idle = sortedBulbs.filter((bulb) => bulb.position === null);

  // Filtering preserves the English alphabetical order in positions.
  const availablePositions = positions.filter((position) => {
    return !bulbs.some((bulb) => bulb.position === position);
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

        // Notify House as soon as the backend confirms the change.
        onBulbsChanged();
      }

      // Always read the complete list after a successful change.
      const data = await getBulbs();

      setBulbs(data);
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

  function beginEditing(bulb: Bulb) {
    if (!expanded || controlsDisabled || editor?.id === bulb.id) return;

    setEditor({
      id: bulb.id,
      name: bulb.name,
      position: bulb.position ?? availablePositions.at(0) ?? '',
    });
  }

  function confirmRename(bulb: Bulb) {
    if (!editor || editor.id !== bulb.id || controlsDisabled) return;

    const name = editor.name.trim();

    // Match the backend's Unicode code-point length check.
    if ([...name].length < 1 || [...name].length > 20) {
      window.alert(text.invalidName);
      return;
    }

    if (name === bulb.name) return;

    const confirmed = window.confirm(
      `${text.renameQuestion}\n\n${bulb.name} → ${name}`,
    );

    if (confirmed) {
      void synchronize(() => renameBulb(bulb.id, name));
    }
  }

  function confirmPosition(bulb: Bulb, position: Position | '') {
    if (controlsDisabled) return;

    if (bulb.position !== null) {
      // Label the bulb name and its current installation position.
      const confirmed = window.confirm(
        `${text.uninstallQuestion}\n\n` +
        `${text.name}: ${bulb.name}\n` +
        `${text.dialogPosition}: ${text.positions[bulb.position]}`,
      );

      if (confirmed) {
        void synchronize(() => uninstallBulb(bulb.id));
      }

      return;
    }

    if (position === '' || !availablePositions.includes(position)) return;

    // Label the bulb name and the proposed installation position.
    const confirmed = window.confirm(
      `${text.installQuestion}\n\n` +
      `${text.name}: ${bulb.name}\n` +
      `${text.dialogPosition}: ${text.positions[position]}`,
    );

    if (confirmed) {
      void synchronize(() => installBulb(bulb.id, position));
    }
  }

  // Translate known backend failures without exposing technical messages.
  let detail = '';

  if (problem?.message === 'Position is already occupied.') {
    detail = text.occupied;
  } else if (
    problem?.message === 'Bulb is already installed at another position.'
  ) {
    detail = text.alreadyInstalled;
  } else if (problem?.message === 'Bulb not found.') {
    detail = text.missing;
  } else if (
    problem?.message ===
    'Turn off this bulb and wait more than one second before uninstalling it.'
  ) {
    detail = text.activeBulb;
  }

  async function confirmDelete(bulb: Bulb) {
    // Only idle bulbs can be deleted from this interface.
    if (
      bulb.position !== null ||
      controlsDisabled ||
      requestLocked.current
    ) {
      return;
    }

    const confirmed = window.confirm(
      `${text.deleteQuestion}\n\n` +
      `${text.name}: ${bulb.name}\n\n` +
      text.deleteReminder,
    );

    if (!confirmed) return;

    // Prevent other requests while deletion and refresh are in progress.
    requestLocked.current = true;
    setBusy(true);
    setProblem(null);

    let deleted = false;

    try {
      const status = await deleteBulb(bulb.id);

      if (status !== 200) {
        window.alert(text.deleteFailed);
        return;
      }

      deleted = true;

      // Deletion also changes the bulb inventory.
      onBulbsChanged();

      window.alert(text.deleteSuccess);

      // Reload the complete list after the successful deletion.
      const data = await getBulbs();

      setBulbs(data);
      setEditor(null);
      setReady(true);
    } catch (error: unknown) {
      if (deleted) {
        // A refresh failure does not mean the deletion failed.
        setReady(false);
        setProblem({
          phase: 'refresh',
          message: errorMessage(error),
        });
      } else {
        window.alert(text.deleteFailed);
      }
    } finally {
      requestLocked.current = false;
      setBusy(false);
    }
  }

  function renderBulb(bulb: Bulb) {
    const editing = editor?.id === bulb.id;
    const status =
      bulb.position === null ? text.idle : text.positions[bulb.position];

    // Use an empty string when no installation position is available.
    const selectedPosition =
      bulb.position ??
      (editing &&
        editor.position !== '' &&
        availablePositions.includes(editor.position)
        ? editor.position
        : availablePositions.at(0) ?? '');

    const rowClass =
      `bulb-row ${bulb.position === null ? 'is-idle' : 'is-installed'}` +
      (expanded && editing ? ' is-editing' : '');

    if (!expanded) {
      return (
        <li
          key={bulb.id}
          className={rowClass}
          title={status}
          tabIndex={0}
          aria-label={`${bulb.name}: ${status}`}
        >
          <span className="bulb-compact-name">{bulb.name}</span>
        </li>
      );
    }

    return (
      <li
        key={bulb.id}
        className={rowClass}
        onClick={() => beginEditing(bulb)}
      >
        <div className="bulb-name-cell">
          {bulb.position === null && (
            <button
              type="button"
              className="bulb-delete-button"
              aria-label={`${text.deleteBulb}: ${bulb.name}`}
              title={text.deleteBulb}
              disabled={controlsDisabled}
              onClick={(event) => {
                // Deleting should not also activate name editing.
                event.stopPropagation();
                void confirmDelete(bulb);
              }}
            >
              X
            </button>
          )}
          {editing ? (
            <form
              className="bulb-inline-controls"
              onSubmit={(event) => {
                event.preventDefault();
                confirmRename(bulb);
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
                  controlsDisabled || editor.name.trim() === bulb.name
                }
              >
                {text.confirmChange}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="bulb-name-button"
              disabled={controlsDisabled}
              onClick={() => beginEditing(bulb)}
            >
              {bulb.name}
            </button>
          )}
        </div>

        <code className="bulb-serial" aria-label={text.serial}>
          {bulb.serial_number}
        </code>

        <div className="bulb-inline-controls">
          <select
            aria-label={`${text.position}: ${bulb.name}`}
            value={selectedPosition}
            disabled={
              controlsDisabled ||
              bulb.position !== null ||
              availablePositions.length === 0
            }
            onChange={(event) => {
              const position = event.target.value;

              if (!isPosition(position)) return;

              // Selecting a position also selects this row for editing.
              // Preserve the name draft if this row is already being edited.
              setEditor((current) => ({
                id: bulb.id,
                name: current?.id === bulb.id ? current.name : bulb.name,
                position,
              }));
            }}
          >
            {bulb.position !== null ? (
              <option value={bulb.position}>
                {text.positions[bulb.position]}
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
              (bulb.position === null && selectedPosition === '')
            }
            onClick={(event) => {
              // Do not also trigger the row's name-editing action.
              event.stopPropagation();
              confirmPosition(bulb, selectedPosition);
            }}
          >
            {bulb.position === null ? text.confirm : text.uninstall}
          </button>
        </div>
      </li>
    );
  }

  return (
    <div
      className={`bulb-manager ${expanded ? 'is-expanded' : 'is-compact'}`}
      aria-busy={busy}
    >
      {busy && (
        <p className="bulb-message" role="status">
          {ready ? text.saving : text.loading}
        </p>
      )}

      {problem && (
        <div className="bulb-error" role="alert">
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

      <div className="bulb-list-scroll">
        {expanded && (
          <div className="bulb-column-headings">
            <span>{text.name}</span>
            <span>{text.serial}</span>
            <span>{text.position}</span>
          </div>
        )}
        {ready && bulbs.length === 0 && (
          <p className="bulb-message">{text.empty}</p>
        )}

        {installed.length > 0 && (
          <ul className="bulb-group">
            {installed.map(renderBulb)}
          </ul>
        )}

        {idle.length > 0 && (
          <ul className="bulb-group bulb-idle-group">
            {idle.map(renderBulb)}
          </ul>
        )}
      </div>

      {expanded && (
        <footer className="bulb-footer">
          <button
            type="button"
            className="bulb-add-button"
            disabled={controlsDisabled}
            onClick={() => void synchronize(createBulb)}
          >
            {text.add}
          </button>
        </footer>
      )}
    </div>
  );
}