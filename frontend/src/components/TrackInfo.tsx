'use client';

interface TrackInfoProps {
  trackName: string;
  bpm: number;
  artist?: string;
}

export default function TrackInfo({ trackName, bpm, artist }: TrackInfoProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-4">Current Track</h3>
      
      <div className="flex items-center justify-between">
        {/* Track details */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2 truncate">
            {trackName}
          </h2>
          {artist && (
            <p className="text-lg text-neutral-300 mb-3 truncate">
              by {artist}
            </p>
          )}
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-sm">BPM</span>
              <span className="text-white font-mono text-lg font-bold">
                {bpm}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-sm">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* BPM Visualizer */}
        <div className="ml-6">
          <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center relative">
            <div 
              className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
              style={{
                animationDuration: `${60/Math.max(bpm, 1)}s`
              }}
            ></div>
            <div className="absolute -bottom-6 text-xs text-neutral-400 text-center w-full">
              Beat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
