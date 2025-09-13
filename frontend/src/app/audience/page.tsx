import SongVoteCard from '@/components/SongVoteCard';
import Sidebar from '@/components/sidebar';

export default function AudiencePage() {
  return (
    <div className="grid grid-cols-5 min-h-screen text-white">
      <Sidebar />
      <main className="col-span-4 relative flex flex-col items-center justify-center p-4 sm:p-8 md:p-24 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-black bg-opacity-25"></div>
        <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
          <SongVoteCard songName="Strobe - Dimension Remix" />
        </div>
      </main>
    </div>
  );
}
