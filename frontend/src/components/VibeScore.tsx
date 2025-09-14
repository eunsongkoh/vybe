interface VibeScoreProps {
  score: number;
}

export default function VibeScore({ score }: VibeScoreProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg flex flex-col items-center justify-center h-full">
      <h3 className="text-neutral-400 text-sm mb-2">Vibe Score</h3>
      <p className="text-5xl md:text-6xl font-bold">{score}</p>
    </div>
  );
}
