import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem('scc_debug_nav') === '1') {
        console.log('[NAV DEBUG]', {
          ts: new Date().toISOString(),
          ctx: 'route-change',
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        });
      }
    } catch { /* ignore */ }
  }, [location]);

  return null;
}
