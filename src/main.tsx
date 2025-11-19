import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * The entry point of the application.
 * Renders the App component into the root element.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);