'use client';
import { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import VibeScore from '@/components/VibeScore';
import TrackInfo from '@/components/TrackInfo';
import AudienceVotes from '@/components/AudienceVotes';
import TrendGraph from '@/components/TrendGraph';

export default function DjPage() {
  const trackId = 'strobe-dimension-remix';
  const [vibeScore, setVibeScore] = useState(88);
  const [movement, setMovement] = useState(78);
  const [energy, setEnergy] = useState('High');

  const [vibeTrend, setVibeTrend] = useState([88, 89, 87, 90, 92, 91, 93]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newVibeScore = Math.min(100, Math.max(0, vibeScore + Math.floor(Math.random() * 5) - 2));
      setVibeScore(newVibeScore);
      setVibeTrend(prev => [...prev.slice(1), newVibeScore]);
      setMovement(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 7) - 3)));
      setEnergy(Math.random() > 0.5 ? 'High' : 'Low');
    }, 2000);

    return () => clearInterval(interval);
  }, [vibeScore]);

  return (
    <div className="bg-black text-white p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Header */}
          <div className="lg:col-span-3">
            <h1 className="text-4xl font-bold">DJ Dashboard</h1>
            <p className="text-lg text-gray-400">Live nightclub analytics</p>
          </div>

          {/* Vibe Score and Track Info */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <VibeScore score={vibeScore} />
            <TrackInfo trackName="Strobe - Dimension Remix" bpm={128} />
          </div>

          {/* Metrics and Graph */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <MetricCard title="Movement" value={`${movement}%`} />
              <MetricCard title="Energy" value={energy} />
              <MetricCard title="Audience Density" value="Packed" />
              <div className="md:col-span-3">
                <AudienceVotes trackId={trackId} />
              </div>
            </div>
            <TrendGraph data={vibeTrend} />
        </div>
      </div>
    </div>
  );
}
