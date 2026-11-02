// ============================================================
// hooks/useDocumentTitle.js
// Title of the browser tab, different on each page: useful for
// search engines (SEO) and for screen reader users, who hear it
// when the page changes.
// ============================================================

import { useEffect } from 'react';

/** @param {string} [title] - page title, without the site name */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - Miaoutic` : 'Miaoutic';
  }, [title]);
}
