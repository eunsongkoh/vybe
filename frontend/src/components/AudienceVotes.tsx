'use client';

import { useEffect, useState } from 'react';
import { wsOn, wsSend, getWS } from '@/lib/ws';

interface Props {
  trackId?: string; // Make optional since we'll fetch current track
}

export default function AudienceVotes({ trackId }: Props) {
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('Loading...');
  const [artist, setArtist] = useState<string>('');

  // Clock that updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch current track info and vote counts every second
  useEffect(() => {
    const fetchCurrentTrack = () => {
      console.log("🔄 Fetching current track info...");
      
      // First get the current track ID from the "current" entry
      wsSend({ action: 'get_vote_counts', trackId: 'current' });
    };

    // Fetch immediately
    fetchCurrentTrack();
    
    // Then fetch every second for live updates
    const interval = setInterval(fetchCurrentTrack, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get vote counts for the actual track once we know its ID
  useEffect(() => {
    if (currentTrackId) {
      console.log("📊 Getting vote counts for:", currentTrackId);
      wsSend({ action: 'get_vote_counts', trackId: currentTrackId });
    }
  }, [currentTrackId]);

  useEffect(() => {
    getWS(); // ensure connection

    // Listen for vote count responses
    const offVoteCounts = wsOn('vote_counts', (msg: any) => {
      console.log("📨 Received vote counts:", msg);
      
      if (msg.trackId === 'current') {
        // This is the current track entry - extract the actual track ID
        // You'll need to modify your Lambda to also return track info
        console.log("🎵 Current track response:", msg);
      } else if (msg.trackId === currentTrackId || msg.trackId === trackId) {
        // This is vote counts for the actual track
        setUp(msg.up ?? 0);
        setDown(msg.down ?? 0);
        
        // If we have track info, update it
        if (msg.trackName) setTrackName(msg.trackName);
        if (msg.artist) setArtist(msg.artist);
      }
    });

    // Listen for any track info updates
    const offTrackUpdate = wsOn('track_info', (msg: any) => {
      console.log("🎵 Track info update:", msg);
      if (msg.trackId) setCurrentTrackId(msg.trackId);
      if (msg.trackName) setTrackName(msg.trackName);
      if (msg.artist) setArtist(msg.artist);
    });

    return () => { 
      offVoteCounts(); 
      offTrackUpdate();
    };
  }, [currentTrackId, trackId]);

  const total = up + down;
  const pct = total > 0 ? Math.round((up / total) * 100) : 0;
  const timeString = currentTime.toLocaleTimeString();

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg">
      {/* Live Clock */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-neutral-400 text-sm">Live Audience Votes</h3>
        <div className="text-neutral-300 text-xs font-mono">
          🕐 {timeString}
        </div>
      </div>

      {/* Current Track Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="text-white text-sm font-semibold truncate">{trackName}</div>
        <div className="text-neutral-400 text-xs truncate">{artist}</div>
        {currentTrackId && (
          <div className="text-neutral-500 text-xs mt-1">ID: {currentTrackId}</div>
        )}
      </div>

      {/* Vote Counts */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-green-500">
          <span className="font-bold text-2xl">{up}</span> 👍
        </div>
        <div className="text-red-500">
          <span className="font-bold text-2xl">{down}</span> 👎
        </div>
        <div className="text-neutral-400 text-sm ml-auto">
          Total: {total}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-700 rounded-full h-2.5">
        <div 
          className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${pct}%` }} 
        />
      </div>
      
      {/* Percentage */}
      <div className="text-center text-neutral-300 text-sm mt-2">
        {total > 0 ? `${pct}% positive` : 'No votes yet'}
      </div>
    </div>
  );
}
