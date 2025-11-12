import api from './api'

// Debug helper (enable with localStorage.setItem('scc_debug_push','1') or reuse 'scc_debug_nav')
function pushDebug(ctx, extra = {}) {
  try {
    const enabled = typeof window !== 'undefined' && (window.localStorage.getItem('scc_debug_push') === '1' || window.localStorage.getItem('scc_debug_nav') === '1');
    if (!enabled) return;
     
    console.log('[PUSH DEBUG]', { ts: new Date().toISOString(), ctx, ...extra });
  } catch {
    // ignore
  }
}

// urlBase64ToUint8Array helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initPush() {
  try {
    pushDebug('init:start', {
      hasSW: 'serviceWorker' in navigator,
      hasPush: 'PushManager' in window,
      hasNotif: 'Notification' in window,
      perm: (typeof Notification !== 'undefined' && Notification.permission) || 'n/a'
    });
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      pushDebug('init:unsupported');
      return { enabled: false, reason: 'unsupported' };
    }

    // Request permission
    const perm = await Notification.requestPermission();
    pushDebug('permission:requested', { perm });
    if (perm !== 'granted') {
      pushDebug('permission:denied');
      return { enabled: false, reason: 'denied' };
    }

    const reg = await navigator.serviceWorker.ready;
  const swScope = reg && reg.scope ? reg.scope : undefined;
  pushDebug('sw:ready', { scope: swScope });
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // Already subscribed, ensure backend knows it
      try {
        const ep = existing && existing.endpoint ? (existing.endpoint.substring(0, 32) + '...') : undefined;
        pushDebug('subscription:existing', { endpoint: ep });
      } catch {
        // ignore logging error
      }
      await api.post('/api/push/subscribe', { subscription: existing });
      pushDebug('backend:subscribe:existing:ok');
      return { enabled: true, status: 'existing' };
    }

    // Fetch VAPID public key
  let res;
  try {
  res = await api.get('/api/push/public-key');
  const resType = typeof res;
  const resKeys = (res && typeof res === 'object') ? Object.keys(res) : [];
  pushDebug('vapid:response', { type: resType, keys: resKeys });
  } catch (e) {
    pushDebug('vapid:error', { name: e?.name, message: e?.message, status: e?.status });
    throw e;
  }
  // Extrair apenas string de chave válida
  const vapidKey = (typeof res === 'string') ? res : (res && (res.publicKey || res.key));
    if (!vapidKey) return { enabled: false, reason: 'no-vapid-key' };
  pushDebug('vapid:ok', { len: (vapidKey ? String(vapidKey).length : 0) });

    try {
      pushDebug('subscribe:attempt');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      // Send subscription to backend
      await api.post('/api/push/subscribe', { subscription: sub });
  const newEp = sub && sub.endpoint ? (sub.endpoint.substring(0, 32) + '...') : undefined;
  pushDebug('backend:subscribe:new:ok', { endpoint: newEp });
      return { enabled: true, status: 'subscribed' };
    } catch (err) {
      // Tolerar erros do push service (ex.: AbortError), não atrapalhar a sessão
      const reason = (err && (err.name || err.message)) || 'push-subscribe-failed';
      let firstStackLine;
      try {
        firstStackLine = (err && err.stack && typeof err.stack.split === 'function') ? err.stack.split('\n')[0] : undefined;
      } catch {
        firstStackLine = undefined;
      }
      pushDebug('subscribe:error', {
        reason,
        name: err && err.name,
        message: err && err.message,
        code: err && err.code,
        stack: firstStackLine
      });
      console.info('initPush non-fatal:', reason);
      return { enabled: false, reason };
    }
  } catch (e) {
    // Não fazer barulho no console por erro de push; manter a sessão fluindo
  const reason = (e && (e.name || e.message)) || 'error';
    let first;
    try {
      first = (e && e.stack && typeof e.stack.split === 'function') ? e.stack.split('\n')[0] : undefined;
    } catch {
      first = undefined;
    }
  pushDebug('init:error', { reason, name: e && e.name, message: e && e.message, stack: first });
    console.info('initPush non-fatal:', reason);
    return { enabled: false, reason };
  }
}

export async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
      await sub.unsubscribe();
      return { ok: true };
    }
    return { ok: true, skipped: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'error' };
  }
}
