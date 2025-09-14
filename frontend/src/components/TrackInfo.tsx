interface TrackInfoProps {
  trackName: string;
  bpm: number;
}

export default function TrackInfo({ trackName, bpm }: TrackInfoProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-4 md:p-6 rounded-lg w-full">
      <h3 className="text-neutral-400 text-sm mb-2">Current Track</h3>
      <p className="text-xl md:text-2xl font-bold">{trackName}</p>
      <p className="text-md md:text-lg text-neutral-400">{bpm} BPM</p>
    </div>
  );
}
