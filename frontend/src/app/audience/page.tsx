import SongVoteCard from '@/components/SongVoteCard';

export default function AudiencePage() {
  const trackId = 'strobe-dimension-remix'; // however you identify the current track

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/path-to-your-background-image.jpg')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md"></div>
      </div>
      <div className="relative z-10 text-center p-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          <span className="block">Vote for the</span>
          <span className="block text-indigo-400">Next Vibe</span>
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Let the DJ know what you want to hear next!
        </p>
      </div>
      <div className="relative z-10 mt-12">
        <SongVoteCard songName="Strobe - Dimension Remix" trackId={trackId} />
      </div>
    </div>
  );
}
