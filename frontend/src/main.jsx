// ============================================================
// main.jsx - entry point of the React application
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts hosted with the site (no request to Google Fonts:
// better for privacy and for performance). Latin characters only
// (eco-design): they cover French, accents, « », œ and €.
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/fredoka/latin-600.css';

import './styles/main.scss';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
