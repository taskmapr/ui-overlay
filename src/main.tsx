import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './demo/App';
import { HighlightProvider } from './contexts/HighlightContext';
import './styles/globals.css';
import './demo/demo.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HighlightProvider>
        <App />
      </HighlightProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
