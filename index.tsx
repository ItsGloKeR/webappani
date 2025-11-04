import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- START: Suppress unwanted third-party console logs ---
// This is a workaround to hide specific, harmless console messages
// originating from third-party scripts (e.g., embedded players, comment widgets)
// that are cluttering the console.
const unwantedLogs = [
    "Custom token received",
];
const originalLog = console.log;
console.log = function(...args) {
    if (typeof args[0] === 'string' && unwantedLogs.some(unwanted => args[0].includes(unwanted))) {
        return;
    }
    originalLog.apply(console, args);
};

const unwantedWarnings = [
    "Received message from untrusted origin:",
];
const originalWarn = console.warn;
console.warn = function(...args) {
    if (typeof args[0] === 'string' && unwantedWarnings.some(unwanted => args[0].includes(unwanted))) {
        return;
    }
    originalWarn.apply(console, args);
};
// --- END: Suppress unwanted third-party console logs ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use a simple, root-relative path. This is the most compatible and
    // robust method for modern hosting platforms like Vercel.
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
