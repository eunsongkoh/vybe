'use client';

import { useEffect, useState } from 'react';
import { wsOn, wsSend, getWS } from '@/lib/ws';

interface Props {
  trackId: string;
}

export default function AudienceVotes({ trackId }: Props) {
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);

  useEffect(() => {
  getWS(); // ensure connection

  // BEFORE (remove this line):
  // wsSend({ action: 'vote', trackId: currTrackID ?? trackId, vote: 'up' });

    // AFTER (ask server for current counts for this track):
  wsSend({ action: 'get_vote_counts', trackId });

    // listen for broadcasts
    const off = wsOn('vote_counts', (msg: any) => {
      if (msg.trackId === trackId) {
        setUp(msg.up ?? 0);
        setDown(msg.down ?? 0);
      }
    });

    return () => { off(); };
  }, [trackId]);


  const total = up + down;
  const pct = total > 0 ? Math.round((up / total) * 100) : 0;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-2">Audience Votes</h3>
      <div className="flex items-center gap-4">
        <div className="text-green-500"><span className="font-bold text-2xl">{up}</span> 👍</div>
        <div className="text-red-500"><span className="font-bold text-2xl">{down}</span> 👎</div>
      </div>
      <div className="w-full bg-neutral-700 rounded-full h-2.5 mt-4">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
