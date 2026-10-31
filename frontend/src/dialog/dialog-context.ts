import { createContext, useContext } from 'react';

export type DialogOption = {
  value: string;
  label: string;
};

type DialogActions = {
  ask: (message: string) => Promise<boolean>;
  inform: (message: string) => Promise<boolean>;
  choose: (
    message: string,
    options: DialogOption[],
  ) => Promise<string | null>;
};

export const DialogContext = createContext<DialogActions | null>(null);

export function useDialog(): DialogActions {
  const context = useContext(DialogContext);

  if (context === null) {
    throw new Error('useDialog must be used inside DialogProvider.');
  }

  return context;
}