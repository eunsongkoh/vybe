'use client';

import { useEffect, useState } from 'react';
import { getWS } from '@/lib/ws';

interface TrackInfoProps {
  // Optional fallbacks used until live data arrives
  trackName?: string;
  trackId?: string;
  bpm?: number;
}

type TrackRecord = {
  track_id: string;           // e.g., "current" or actual id
  track_id_actual?: string;   // only on the "current" row
  track_name?: string;
  bpm?: number;               // add if your API returns it
};

export default function TrackInfo({ trackName, trackId, bpm }: TrackInfoProps) {
  const [currName, setCurrName] = useState<string>(trackName ?? 'Loading…');
  const [currId, setCurrId] = useState<string | undefined>(trackId);
  const [currBpm, setCurrBpm] = useState<number | undefined>(bpm);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch (+ light polling as safety net)
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_TRACKS_ENDPOINT;
    if (!endpoint) return;

    let cancelled = false;

    const fetchCurrent = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed: ${res.status} ${res.statusText}`);
        const data: TrackRecord[] = await res.json();
        if (cancelled) return;

        const current = data.find(d => d.track_id === 'current');
        const actualId = current?.track_id_actual;
        if (!actualId) return;

        const actual = data.find(d => d.track_id === actualId);
        setCurrId(actualId);
        if (actual?.track_name) setCurrName(actual.track_name);
        if (typeof actual?.bpm === 'number') setCurrBpm(actual.bpm);

        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Error fetching track');
      }
    };

    fetchCurrent();
    const t = setInterval(fetchCurrent, 5000); // optional if WS is reliable
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Live updates via WebSocket
  // Expect either:
  //  - { type: 'current_track', trackId, trackName?, bpm? }
  //  - or { type: 'track_meta', trackId, bpm } for separate BPM pushes
  useEffect(() => {
    const ws = getWS();
    const onMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        if (data?.type === 'current_track') {
          if (data.trackId) setCurrId(data.trackId);
          if (typeof data.bpm === 'number') setCurrBpm(data.bpm);
          if (data.trackName) setCurrName(data.trackName);
          setError(null);
        }

        if (data?.type === 'track_meta') {
          // only adopt if it’s for the track we’re showing
          const targetId = data.trackId ?? currId;
          if (!targetId) return;
          if (currId && data.trackId && data.trackId !== currId) return;

          if (typeof data.bpm === 'number') setCurrBpm(data.bpm);
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [currId]);

  const displayName = currName ?? trackName ?? 'Loading…';
  const displayId = currId ?? trackId;
  const displayBpm = typeof currBpm === 'number' ? currBpm : bpm;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-2">Current Track</h3>
      <p className="text-2xl font-bold">{displayName}</p>
      <p className="text-lg text-neutral-400">{displayBpm ?? '—'} BPM</p>
      {displayId && <p className="text-xs text-neutral-500 mt-1">ID: {displayId}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
