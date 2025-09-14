import AppLayout from '@/components/AppLayout';
import SongVoteCard from '@/components/SongVoteCard';

export default function AudiencePage() {
  return (
    <AppLayout>
      <div className="w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Audience Voting</h1>
        <SongVoteCard songName="Strobe - Dimension Remix" />
      </div>
    </AppLayout>
  );
}
