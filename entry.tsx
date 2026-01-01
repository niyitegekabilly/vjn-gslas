
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Safe Polyfill for process.env
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: { NODE_ENV: 'production' } };
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
