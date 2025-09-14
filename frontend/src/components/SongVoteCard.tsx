'use client';

import { useState, useEffect } from 'react';
import { wsSend, getWS } from '@/lib/ws';

const UpArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const DownArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

interface SongVoteCardProps {
  songName?: string;   // optional fallback
  trackId: string;     // fallback if API fails to resolve current
}

interface TrackRecord {
  track_id: string;
  track_id_actual?: string;
  track_name?: string;
  // add other fields if your API returns them
}

export default function SongVoteCard({ songName, trackId }: SongVoteCardProps) {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  const [currTrackName, setCurrTrackName] = useState<string>(songName ?? 'Loading…');
  const [currTrackID, setCurrTrackID] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Open WebSocket once on mount; close on unmount
  useEffect(() => {
    const ws = getWS();
    return () => {
    };
  }, []);

  // Fetch current track info once on mount
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

        // 1) find the "current" record
        const current = data.find(d => d.track_id === 'current');
        if (!current || !current.track_id_actual) {
          throw new Error('No current record found');
        }

        const actualID = current.track_id_actual;
        setCurrTrackID(actualID);

        // 2) find the record with that track_id
        const actual = data.find(d => d.track_id === actualID);
        if (!actual || !actual.track_name) {
          throw new Error(`No record found for track_id ${actualID}`);
        }

        setCurrTrackName(actual.track_name);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Error fetching track');
          // fallback to provided prop if available
          setCurrTrackName(songName ?? 'Unknown Track');
          setCurrTrackID(trackId ?? null);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const sendVote = (vote: 'up' | 'down') => {
    const id = currTrackID ?? trackId;

    // optimistic UI update
    if (vote === 'up') {
      setUpvotes(v => v + 1);
    } else {
      setDownvotes(v => v + 1);
    }

    const ws = getWS();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'vote', trackId: id, vote }));
    }
  };


  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-8 text-white w-full max-w-sm shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          {currTrackName}
        </h2>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      <div className="flex justify-around items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-sm font-semibold">Downvote</span>
          <button
            onClick={() => sendVote('down')}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-full w-24 h-24 flex items-center justify-center transition-colors shadow-lg"
          >
            <DownArrowIcon />
          </button>
          <span className="font-bold text-2xl text-slate-300">{downvotes}</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-sm font-semibold">Upvote</span>
          <button
            onClick={() => sendVote('up')}
            className="bg-white hover:bg-slate-200 text-slate-900 rounded-full w-24 h-24 flex items-center justify-center transition-colors shadow-lg"
          >
            <UpArrowIcon />
          </button>
          <span className="font-bold text-2xl text-slate-300">{upvotes}</span>
        </div>
      </div>
    </div>
  );
}
