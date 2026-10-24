import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { dialogText } from '../i18n';
import type { Language } from '../i18n';
import { DialogContext } from './dialog-context';

import './Dialog.css';

type Props = {
  language: Language;
  children: ReactNode;
};

type DialogState = {
  message: string;
  confirmation: boolean;
};

export default function DialogProvider({
  language,
  children,
}: Props) {
  const text = dialogText[language];

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const element = useRef<HTMLDialogElement>(null);

  // Store the function that completes the waiting promise.
  const pending = useRef<((answer: boolean) => void) | null>(null);

  const finish = useCallback((answer: boolean) => {
    const resolve = pending.current;
    pending.current = null;

    element.current?.close();
    setDialog(null);
    resolve?.(answer);
  }, []);

  const open = useCallback(
    (message: string, confirmation: boolean): Promise<boolean> => {
      // Never overwrite a dialog that is waiting for an answer.
      // A second confirmation is treated as cancelled.
      if (pending.current) return Promise.resolve(false);

      return new Promise<boolean>((resolve) => {
        pending.current = resolve;
        setDialog({ message, confirmation });
      });
    },
    [],
  );

  const ask = useCallback(
    (message: string) => open(message, true),
    [open],
  );

  const inform = useCallback(
    (message: string) => open(message, false),
    [open],
  );

  useEffect(() => {
    if (!dialog) return;

    const node = element.current;
    if (!node) return;

    // Block background interaction without pausing JavaScript.
    node.showModal();

    return () => {
      node.close();
    };
  }, [dialog]);

  useEffect(() => {
    return () => {
      // Cancel any pending answer when the provider is removed.
      pending.current?.(false);
      pending.current = null;
    };
  }, []);

  return (
    <DialogContext.Provider value={{ ask, inform }}>
      {children}

      {dialog &&
        createPortal(
          <dialog
            ref={element}
            className="app-dialog"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
            onCancel={(event) => {
              // Escape acts like Cancel.
              event.preventDefault();
              finish(false);
            }}
          >
            <h2 id="app-dialog-title">{text.title}</h2>

            <p
              id="app-dialog-message"
              className="app-dialog-message"
            >
              {dialog.message}
            </p>

            <div className="app-dialog-actions">
              {dialog.confirmation && (
                <button
                  type="button"
                  autoFocus
                  onClick={() => finish(false)}
                >
                  {text.cancel}
                </button>
              )}

              <button
                type="button"
                autoFocus={!dialog.confirmation}
                onClick={() => finish(true)}
              >
                {dialog.confirmation ? text.confirm : text.close}
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </DialogContext.Provider>
  );
}