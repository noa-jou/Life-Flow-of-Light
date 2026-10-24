import { createContext, useContext } from 'react';

type DialogActions = {
  ask: (message: string) => Promise<boolean>;
  inform: (message: string) => Promise<boolean>;
};

// Components inside the provider can access the same dialog.
export const DialogContext = createContext<DialogActions | null>(null);

export function useDialog(): DialogActions {
  const context = useContext(DialogContext);

  if (context === null) {
    throw new Error('useDialog must be used inside DialogProvider.');
  }

  return context;
}