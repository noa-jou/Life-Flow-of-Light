import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { dialogText } from '../i18n';
import type { Language } from '../i18n';
import { DialogContext } from './dialog-context';
import type { DialogOption } from './dialog-context';
import './Dialog.css';

type Props = {
  language: Language;
  children: ReactNode;
};

type DialogState =
  | {
      kind: 'ask' | 'inform';
      message: string;
    }
  | {
      kind: 'choose';
      message: string;
      options: DialogOption[];
    };

type DialogAnswer = boolean | string | null;

export default function DialogProvider({ language, children }: Props) {
  const text = dialogText[language];
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const element = useRef<HTMLDialogElement>(null);
  const pending = useRef<((answer: DialogAnswer) => void) | null>(null);

  const finish = useCallback((answer: DialogAnswer) => {
    const resolve = pending.current;

    pending.current = null;
    element.current?.close();
    setDialog(null);
    resolve?.(answer);
  }, []);

  const open = useCallback(
    (nextDialog: DialogState): Promise<DialogAnswer> => {
      // Do not replace a dialog that is waiting for an answer.
      if (pending.current) {
        return Promise.resolve(null);
      }

      return new Promise<DialogAnswer>((resolve) => {
        pending.current = resolve;
        setDialog(nextDialog);
      });
    },
    [],
  );

  const ask = useCallback(
    async (message: string): Promise<boolean> => {
      const answer = await open({ kind: 'ask', message });
      return answer === true;
    },
    [open],
  );

  const inform = useCallback(
    async (message: string): Promise<boolean> => {
      const answer = await open({ kind: 'inform', message });
      return answer === true;
    },
    [open],
  );

  const choose = useCallback(
    async (
      message: string,
      options: DialogOption[],
    ): Promise<string | null> => {
      const answer = await open({
        kind: 'choose',
        message,
        options,
      });

      return typeof answer === 'string' ? answer : null;
    },
    [open],
  );

  useEffect(() => {
    if (!dialog) return;

    const node = element.current;
    if (!node) return;

    node.showModal();

    return () => {
      node.close();
    };
  }, [dialog]);

  useEffect(() => {
    return () => {
      pending.current?.(null);
      pending.current = null;
    };
  }, []);

  return (
    <DialogContext.Provider value={{ ask, inform, choose }}>
      {children}

      {dialog &&
        createPortal(
          <dialog
            ref={element}
            className="app-dialog"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
            onCancel={(event) => {
              event.preventDefault();
              finish(null);
            }}
          >
            <h2 id="app-dialog-title">{text.title}</h2>

            <p id="app-dialog-message" className="app-dialog-message">
              {dialog.message}
            </p>

            <div className="app-dialog-actions">
              {dialog.kind === 'choose' ? (
                <>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => finish(null)}
                  >
                    {text.cancel}
                  </button>

                  {dialog.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => finish(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {dialog.kind === 'ask' && (
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
                    autoFocus={dialog.kind === 'inform'}
                    onClick={() => finish(true)}
                  >
                    {dialog.kind === 'ask' ? text.confirm : text.close}
                  </button>
                </>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </DialogContext.Provider>
  );
}