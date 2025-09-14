'use client';

import { useEffect, useState } from 'react';
import { getWS } from '@/lib/ws';

// Keep the same props; "score" acts as a fallback until live data arrives
interface VibeScoreProps {
  score?: number;
}

interface TrackRecord {
  track_id: string;
  track_id_actual?: string;
  track_name?: string;
  energy_score?: string;
  recommendation?: string; 
  // add other fields if your API returns them
}


export default function VibeScore({ score }: VibeScoreProps) {
  const [liveScore, setLiveScore] = useState<number | undefined>(score);
  const [error, setError] = useState<string | null>(null);
  const [energyScore, setEnergyScore] = useState(""); 
  const [recc, setRecc] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_TRACKS_ENDPOINT;
    if (!endpoint) {
      setError('NEXT_PUBLIC_TRACKS_ENDPOINT is not set');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed: ${res.status} ${res.statusText}`);

        const data: TrackRecord[] = await res.json();
        if (cancelled) return;
        console.log(data)

        // 1) find the "current" record
        const current = data.find(d => d.track_id === 'current');
        if (!current || !current.track_id_actual) {
          throw new Error('No current record found');
        }

        const actualID = current.track_id_actual;

        // 2) find the record with that track_id
        const actual = data.find(d => d.track_id === actualID);
        if (!actual || !actual.track_name) {
          throw new Error(`No record found for track_id ${actualID}`);
        }
        if (actual.energy_score){
          setEnergyScore(actual.energy_score);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Error fetching track');
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // const display = typeof liveScore === 'number' ? liveScore : (score ?? 0);

  // --- Keep your original UI here; example:
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-8 text-white w-full shadow-2xl">
      <h3 className="text-neutral-400 text-sm mb-2">Energy Score</h3>
      <p className="text-5xl font-extrabold">{energyScore}</p>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
