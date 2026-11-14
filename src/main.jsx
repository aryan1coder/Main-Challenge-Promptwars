import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Global Unhandled Rejection filter to isolate third-party browser extension exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const stack = reason?.stack || '';
    const message = reason?.message || String(reason || '');

    // Identify third-party browser extension scripts (e.g. 200.js, chrome-extension://)
    const isExtensionError =
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('200.js') ||
      message.includes("'M" + "_ID'") ||
      message.includes('"M' + '_ID"');

    if (isExtensionError) {
      // Prevent third-party extension crashes from interrupting application runtime
      console.warn('Third-party browser extension uncaught rejection filtered:', message);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
