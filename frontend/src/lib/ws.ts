let socket: WebSocket | null = null;
type Listener = (m: any) => void;
const listeners = new Map<string, Set<Listener>>();

function routeMessage(raw: MessageEvent) {
  try {
    const data = JSON.parse((raw as any).data);
    const eventType = data?.type ?? data?.event ?? data?.action ?? null;

    if (!eventType) {
      console.warn('[WS] message missing type/event/action:', data);
      return;
    }

    const set = listeners.get(eventType);
    if (!set || set.size === 0) {
      console.warn(`[WS] no listeners for "${eventType}"`, data);
      return;
    }
    set.forEach((cb) => cb(data));
  } catch (err) {
    console.error('[WS] bad JSON message:', (raw as any).data, err);
  }
}

export function getWS() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }
  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (!url) throw new Error('Set NEXT_PUBLIC_WS_URL in your env');

  socket = new WebSocket(url);

  socket.addEventListener('open', () => console.log('[WS] open:', url));
  socket.addEventListener('close', (e) => console.warn('[WS] close:', e.code, e.reason));
  socket.addEventListener('error', (e) => console.error('[WS] error:', e));
  socket.addEventListener('message', routeMessage);

  return socket;
}

export function wsOn(type: string, cb: Listener) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(cb);
  return () => listeners.get(type)!.delete(cb);
}

export function wsSend(data: any) {
  const ws = getWS();
  const payload = JSON.stringify(data);
  if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  else ws.addEventListener('open', () => ws.send(payload), { once: true });
}
