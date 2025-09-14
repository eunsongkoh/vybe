import AppLayout from '@/components/AppLayout';
import MetricCard from '@/components/MetricCard';
import VibeScore from '@/components/VibeScore';
import TrackInfo from '@/components/TrackInfo';
import AudienceVotes from '@/components/AudienceVotes';

export default function DjPage() {
  return (
    <AppLayout>
      <div className="w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">DJ Dashboard</h1>
        <div className="grid w-full grid-cols-1 gap-8 mb-8 md:grid-cols-2">
          <VibeScore score={88} />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <MetricCard title="Movement" value="78%" change="+5%" changeType="increase" />
            <MetricCard title="Energy" value="High" change="-2%" changeType="decrease" />
            <AudienceVotes upvotes={128} downvotes={23} />
          </div>
        </div>
        <TrackInfo trackName="Strobe - Dimension Remix" bpm={128} />
      </div>
    </AppLayout>
  );
}
