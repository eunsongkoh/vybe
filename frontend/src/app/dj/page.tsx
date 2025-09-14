import Sidebar from '@/components/sidebar';
import MetricCard from '@/components/MetricCard';
import EnergyScore from '@/components/EnergyScore'; // now self-updating
import TrackInfo from '@/components/TrackInfo';  // already made live
import AudienceVotes from '@/components/AudienceVotes';
import RecommendationCard from '@/components/ReccomendationCard';

export default function DjPage() {
  const trackId = 'strobe-dimension-remix'; // fallback for other components if needed

  return (
    <div className="grid grid-cols-5 min-h-screen text-white">
      <Sidebar />
      <main className="col-span-4 flex flex-col items-center justify-center p-24">
        <div className="w-full max-w-5xl font-sans text-sm flex flex-col gap-8">
          <h1 className="text-4xl font-bold mb-8">DJ Dashboard</h1>
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* VibeScore will live update via WS / polling */}
            <EnergyScore score={88} /> {/* 'score' is just a fallback */}

            <div className="grid grid-cols-2 gap-8">
              {/* Live movement and energy */}
              <RecommendationCard />
            


              {/* Votes already live via your WebSocket */}
              <AudienceVotes trackId={trackId} />
            </div>
          </div>

          {/* TrackInfo now live-updates name/id/bpm */}
          <TrackInfo trackId={trackId} />
        </div>
      </main>
    </div>
  );
}
