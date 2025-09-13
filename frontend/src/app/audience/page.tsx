import SongVoteCard from '@/components/SongVoteCard';
import Sidebar from '@/components/sidebar';

export default function AudiencePage() {
  return (
    <div className="grid grid-cols-5 min-h-screen text-white">
      <Sidebar />
      <main className="col-span-4 flex flex-col items-center justify-center p-4 sm:p-8 md:p-24">
        <div className="w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
          <SongVoteCard songName="Strobe - Dimension Remix" />
        </div>
      </main>
    </div>
  );
}
