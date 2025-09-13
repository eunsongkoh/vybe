import Sidebar from '@/components/sidebar';
import MetricCard from '@/components/MetricCard';
import VibeScore from '@/components/VibeScore';
import TrackInfo from '@/components/TrackInfo';
import AudienceVotes from '@/components/AudienceVotes';

export default function DjPage() {
  return (
    <div className="grid grid-cols-5 min-h-screen bg-neutral-950 text-white">
      <Sidebar />
      <main className="col-span-4 p-8">
        <h1 className="text-4xl font-bold mb-8">DJ Dashboard</h1>
        <div className="grid grid-cols-2 gap-8 mb-8">
          <VibeScore score={88} />
          <div className="grid grid-cols-2 gap-8">
            <MetricCard title="Movement" value="78%" change="+5%" changeType="increase" />
            <MetricCard title="Energy" value="High" change="-2%" changeType="decrease" />
            <MetricCard title="Facial Expression" value="Happy" />
            <AudienceVotes upvotes={128} downvotes={23} />
          </div>
        </div>
        <TrackInfo trackName="Strobe - Dimension Remix" bpm={128} />
      </main>
    </div>
  );
}
