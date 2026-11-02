// ============================================================
// components/PageChange.jsx
// In a single page application, changing page does not reload
// the browser: by default the scroll position and the keyboard
// focus stay where they were. On every new page this component:
//   - scrolls back to the top
//   - puts the focus on the main content, so that keyboard and
//     screen reader users start reading the new page
// ============================================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageChange() {
  const { pathname } = useLocation();
  // Address already handled: nothing happens on the first load,
  // nor when React runs the effect twice in development mode
  const handledPathname = useRef(pathname);

  useEffect(() => {
    if (handledPathname.current === pathname) return;
    handledPathname.current = pathname;

    // "instant": Bootstrap makes scrolling smooth by default
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('contenu')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
