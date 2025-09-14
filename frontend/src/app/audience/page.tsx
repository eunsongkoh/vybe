import SongVoteCard from '@/components/SongVoteCard';
import Sidebar from '@/components/sidebar';

export default function AudiencePage() {
  const trackId = 'strobe-dimension-remix'; // however you identify the current track

  return (
    <div className="grid grid-cols-5 min-h-screen text-white">
      <Sidebar />
      <main className="col-span-4 flex flex-col items-center justify-center p-4 sm:p-8 md:p-24">
        <div className="w-full max-w-5xl font-sans text-sm flex flex-col gap-8">
          <SongVoteCard songName="Strobe - Dimension Remix" trackId={trackId} />
        </div>
      </main>
    </div>
  );
}
