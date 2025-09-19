// // lib/ws.ts
// let socket: WebSocket | null = null;
// type Listener = (msg: any) => void;
// const listeners = new Map<string, Set<Listener>>();

// export function getWS() {
//   console.log("CURRENT SOCKET: ", socket)
//   if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
//     console.log()
//     return socket;
//   }
//   const url = process.env.NEXT_PUBLIC_WS_URL;
//   if (!url) throw new Error("Set NEXT_PUBLIC_WS_URL in your env");

//   socket = new WebSocket(url);
//   console.log("socket: ", socket);

//   socket.onmessage = (e) => {
//     try {
//       const data = JSON.parse(e.data);
//       const set = listeners.get(data?.type);
//       if (set) set.forEach((cb) => cb(data));
//     } catch {}
//   };

//   return socket;
// }

// export function wsSend(data: any) {
//   const ws = getWS();
//   // get the vote count 
//   const sendIt = () => ws.send(JSON.stringify(data));
//   if (ws.readyState === WebSocket.OPEN) sendIt();
//   else ws.addEventListener("open", sendIt, { once: true });
// }

// export function wsOn(type: string, cb: Listener) {
//   if (!listeners.has(type)) listeners.set(type, new Set());
//   listeners.get(type)!.add(cb);
//   return () => listeners.get(type)!.delete(cb);
// }
let socket: WebSocket | null = null;

interface Message {
  type: string;
  [key: string]: unknown;
}

const listeners = new Map<string, Set<(m: Message) => void>>();

export function getWS() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return socket;
  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (!url) throw new Error("Set NEXT_PUBLIC_WS_URL in your env");
  socket = new WebSocket(url);
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data) as Message;
      const set = listeners.get(data?.type);
      if (set) set.forEach(cb => cb(data));
    } catch {}
  };
  return socket;
}

export function wsOn(type: string, cb: (m: Message) => void) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(cb);
  return () => listeners.get(type)!.delete(cb);
}

export function wsSend(data: Record<string, unknown>) {
  const ws = getWS();
  const payload = JSON.stringify(data);
  if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  else ws.addEventListener('open', () => ws.send(payload), { once: true });
}
