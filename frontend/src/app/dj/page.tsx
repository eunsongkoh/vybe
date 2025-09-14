'use client';

import { useEffect, useState } from 'react';
import { wsOn, wsSend, getWS } from '@/lib/ws';
import Sidebar from '@/components/sidebar';
import MetricCard from '@/components/MetricCard';
import TrackInfo from '@/components/TrackInfo';
import AudienceVotes from '@/components/AudienceVotes';
import RecommendationCard from '@/components/RecomendationCard';

export default function DjPage() {
  // All live state from WebSockets
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('Connecting...');
  const [artist, setArtist] = useState<string>('');
  const [bpm, setBpm] = useState<number>(0);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [energy, setEnergy] = useState<string>('Loading...');
  const [movement, setMovement] = useState<string>('Loading...');
  const [upVotes, setUpVotes] = useState<number>(0);
  const [downVotes, setDownVotes] = useState<number>(0);

  // Clock that updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch live data every second
  useEffect(() => {
    const fetchLiveData = () => {
      console.log("🔄 DJ Dashboard: Fetching live data...");
      
      // Get current track info from "current" entry
      wsSend({ action: 'get_vote_counts', trackId: 'current' });
      
      // You can add more WebSocket calls here for other metrics
      // wsSend({ action: 'get_vibe_score' });
      // wsSend({ action: 'get_movement_data' });
    };

    // Fetch immediately
    fetchLiveData();
    
    // Then fetch every second for live updates
    const interval = setInterval(fetchLiveData, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getWS(); // ensure connection

    // Listen for vote count responses (which include track info)
    const offVoteCounts = wsOn('vote_counts', (msg: any) => {
      console.log("📨 DJ Dashboard received:", msg);
      
      if (msg.isCurrentTrack && msg.trackId) {
        // This is the current track info
        setCurrentTrackId(msg.trackId);
        if (msg.trackName) setTrackName(msg.trackName);
        if (msg.artist) setArtist(msg.artist);
        if (msg.trackId) setCurrentTrackId(msg.trackId);
      if (msg.trackName) setTrackName(msg.trackName);
      if (msg.artist) setArtist(msg.artist);
      if (msg.bpm) setBpm(msg.bpm);
      if (msg.up) setUpVotes(msg.up);
      if (msg.down) setDownVotes(msg.down);
        console.log("🎵 Updated current track:", msg.trackName, "by", msg.artist);
      }
    });

    // Listen for track info updates
    const offTrackUpdate = wsOn('track_info', (msg: any) => {
      console.log("🎵 DJ Dashboard track info:", msg);
      if (msg.trackId) setCurrentTrackId(msg.trackId);
      if (msg.trackName) setTrackName(msg.trackName);
      if (msg.artist) setArtist(msg.artist);
      if (msg.bpm) setBpm(msg.bpm);
      if (msg.up) setUpVotes(msg.up);
      if (msg.down) setDownVotes(msg.down);
    });

    // Listen for vibe score updates (you'll need to implement this in Lambda)
    const offVibeScore = wsOn('vibe_score', (msg: any) => {
      console.log("📊 Vibe score update:", msg);
      if (msg.score) setVibeScore(msg.score);
      if (msg.energy) setEnergy(msg.energy);
      if (msg.movement) setMovement(msg.movement);
    });

    return () => { 
      offVoteCounts(); 
      offTrackUpdate();
      offVibeScore();
    };
  }, []);


  return (
    <div className="grid grid-cols-5 min-h-screen text-white">
      <Sidebar />
      <main className="col-span-4 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-6xl font-sans text-sm flex flex-col gap-6">
          {/* Header with live clock */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">DJ Dashboard - Live Stats</h1>
            <div className="text-right">
              <div className="text-sm text-neutral-400">
                {currentTrackId ? `Track: ${currentTrackId}` : 'No track selected'}
              </div>
            </div>
          </div>
          
          {/* Top row - Main metrics (all live) */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <MetricCard 
              title="Vibe Score" 
              value={vibeScore.toString()}  
              changeType="increase" 
            />
            <RecommendationCard />
          </div>

          {/* Middle row - Audience feedback (full width for prominence) */}
          <div className="mb-6">
            <MetricCard 
              title="Audience Votes" 
              value={`${upVotes} 👍 / ${downVotes} 👎`} 
            />
          </div>

          {/* Bottom row - Additional live stats */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <MetricCard title="BPM" value={bpm.toString()} />
            <MetricCard title="Beat Sync" value="Perfect" />
            <MetricCard title="Connections" value="Live" />
          </div>

          {/* Track info at bottom (live) */}
          <TrackInfo 
            trackName={trackName} 
            bpm={bpm} 
            artist={artist}
          />
        </div>
      </main>
    </div>
  );
}
