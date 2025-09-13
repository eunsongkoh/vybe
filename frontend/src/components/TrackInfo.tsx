interface TrackInfoProps {
  trackName: string;
  bpm: number;
}

export default function TrackInfo({ trackName, bpm }: TrackInfoProps) {
  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-2">Current Track</h3>
      <p className="text-2xl font-bold">{trackName}</p>
      <p className="text-lg text-neutral-400">{bpm} BPM</p>
    </div>
  );
}
