// ============================================================
// hooks/useDocumentTitle.js
// Title and meta tags of each page, for search engines (SEO) and
// for screen reader users, who hear the title when the page changes.
//
//   useDocumentTitle('Nos chiens', { description: '...' });
//   useDocumentTitle('Mes matchs', { noindex: true });
//
// Miaoutic is a single page application: the server always sends
// the same index.html, so the title and the description are
// updated here. Search engines (Google) run the JavaScript and
// read the updated values.
// ============================================================

import { useEffect } from 'react';

export const DEFAULT_DESCRIPTION = 'Miaoutic, le site de rencontre entre les animaux du refuge et leur future famille : '
  + 'découvrez votre % de match et adoptez.';

/** Creates, updates or removes (content null) a <meta name="..."> tag */
function setMeta(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (content === null) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.append(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * @param {string} [title] - page title, without the site name
 * @param {object} [options]
 * @param {string} [options.description] - summary shown by search engines
 * @param {boolean} [options.noindex] - private page (account, shelter space):
 *   search engines must not show it in their results
 */
export function useDocumentTitle(title, { description, noindex = false } = {}) {
  useEffect(() => {
    document.title = title ? `${title} - Miaoutic` : 'Miaoutic';
    setMeta('description', description ?? DEFAULT_DESCRIPTION);
    setMeta('robots', noindex ? 'noindex, nofollow' : null);
  }, [title, description, noindex]);
}
