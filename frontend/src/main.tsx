import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';

// Find the element where React will mount the application.
const rootElement = document.getElementById('root');

// Stop with a clear error if the HTML root element is missing.
if (!rootElement) {
  throw new Error('React root element was not found.');
}

// Mount the application and enable additional development checks.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);