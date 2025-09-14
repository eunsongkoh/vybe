'use client';

import { useEffect, useState } from 'react';
import { getWS } from '@/lib/ws';
import MetricCard from '@/components/MetricCard';

interface TrackRecord {
  track_id: string;
  track_id_actual?: string;
  track_name?: string;
  energy_score?: string;
  recommendation?: string; 
  // add other fields if your API returns them
}

interface Props {
  title?: string;          // UI label, default "Recommendation"
  fallbackTitle?: string;  // optional fallback before data loads
}

export default function RecommendationCard({ title = 'Recommendation', fallbackTitle }: Props) {
  const [recTitle, setRecTitle] = useState<string>(fallbackTitle ?? '—');
  const [error, setError] = useState<string | null>(null);

  // Fetch once + (optional) poll to resolve "next" from DB
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_TRACKS_ENDPOINT;
    if (!endpoint) return;

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
        if (actual.recommendation){
          const recc_title = data.find(d => d.track_id === actual.recommendation);
          if (recc_title && recc_title.track_name){
            setRecTitle(recc_title.track_name);
          }
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

  return (
    <MetricCard
      title={title}
      value={recTitle}
      // no change badge needed; omit change/changeType
    />
  );
}
