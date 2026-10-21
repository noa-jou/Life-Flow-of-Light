import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';

// 找到 index.html 裡的掛載位置。
const rootElement = document.getElementById('root');

// 若 HTML 少了這個元素，直接給出容易理解的錯誤。
if (!rootElement) {
  throw new Error('找不到 React 的 root 元素。');
}

// 把 App 元件顯示在 root 裡。
// StrictMode 會在開發時協助發現某些不安全的寫法。
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);