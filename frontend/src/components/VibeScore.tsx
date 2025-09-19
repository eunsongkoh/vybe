'use client';
import { useState, useEffect } from 'react';

interface VibeScoreProps {
  score: number;
}

export default function VibeScore({ score }: VibeScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setDisplayScore(score));
    return () => cancelAnimationFrame(animation);
  }, [score]);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg flex flex-col items-center justify-center">
      <h3 className="text-neutral-400 text-sm mb-2">Vibe Score</h3>
      <p className="text-6xl font-bold transition-all duration-500" style={{ transform: `scale(${1 + Math.abs(score - displayScore) / 100})` }}>
        {Math.round(displayScore)}
      </p>
    </div>
  );
}
