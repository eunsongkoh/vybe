'use client';

import { useEffect, useRef, useState } from 'react';
import { getWS } from '@/lib/ws';
import MetricCard from '@/components/MetricCard';

interface Props {
  title?: string;          // default "Energy"
  fallback?: number;       // fallback value (0..100 or 0..1)
}

export default function LiveEnergyCard({ title = 'Energy', fallback = 50 }: Props) {
  const [num, setNum] = useState<number>(fallback);
  const prev = useRef<number>(fallback);

  // Optional polling (if you have an endpoint)
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_METRICS_ENDPOINT;
    if (!endpoint) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json(); // expect { energy: number }
        if (cancelled) return;

        if (typeof data?.energy === 'number') {
          let val = data.energy;
          if (val <= 1) val = val * 100; // normalize 0..1 -> percentage
          val = Math.max(0, Math.min(100, val));
          prev.current = num;
          setNum(val);
        }
      } catch {/* ignore errors */}
    };

    poll();
    const t = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [num]);

  // WebSocket updates
  useEffect(() => {
    const ws = getWS();
    const onMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        // Example WS frame: { type: 'vibe_metrics', energy: 82 }
        if (data?.type === 'vibe_metrics' && typeof data.energy === 'number') {
          let val = data.energy;
          if (val <= 1) val = val * 100;
          val = Math.max(0, Math.min(100, val));
          prev.current = num;
          setNum(val);
        }
      } catch {}
    };
    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [num]);

  const diff = num - prev.current;
  const change = diff !== 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%` : undefined;
  const changeType: 'increase' | 'decrease' | undefined =
    diff > 0 ? 'increase' : diff < 0 ? 'decrease' : undefined;

  return (
    <MetricCard
      title={title}
      value={`${num.toFixed(0)}%`}
      change={change}
      changeType={changeType}
    />
  );
}
