interface VibeScoreProps {
  score: number;
}

export default function VibeScore({ score }: VibeScoreProps) {
  return (
    <div className="bg-neutral-900 p-6 rounded-lg flex flex-col items-center justify-center">
      <h3 className="text-neutral-400 text-sm mb-2">Vibe Score</h3>
      <p className="text-6xl font-bold">{score}</p>
    </div>
  );
}
