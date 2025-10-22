import api from './api'

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
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return { enabled: false, reason: 'unsupported' };
    }

    // Request permission
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { enabled: false, reason: 'denied' };
    }

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // Already subscribed, ensure backend knows it
      await api.post('/api/push/subscribe', { subscription: existing });
      return { enabled: true, status: 'existing' };
    }

    // Fetch VAPID public key
  const res = await api.get('/api/push/public-key');
  // Extrair apenas string de chave válida
  const vapidKey = (typeof res === 'string') ? res : (res && (res.publicKey || res.key));
    if (!vapidKey) return { enabled: false, reason: 'no-vapid-key' };

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      // Send subscription to backend
      await api.post('/api/push/subscribe', { subscription: sub });
      return { enabled: true, status: 'subscribed' };
    } catch (err) {
      // Tolerar erros do push service (ex.: AbortError), não atrapalhar a sessão
      const reason = (err && (err.name || err.message)) || 'push-subscribe-failed';
      console.info('initPush non-fatal:', reason);
      return { enabled: false, reason };
    }
  } catch (e) {
    // Não fazer barulho no console por erro de push; manter a sessão fluindo
    const reason = (e && (e.name || e.message)) || 'error';
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
