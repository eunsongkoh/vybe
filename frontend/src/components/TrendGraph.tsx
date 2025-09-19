'use client';
import { useState } from 'react';

interface TrendGraphProps {
  data: number[];
}

export default function TrendGraph({ data }: TrendGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; value: number } | null>(null);
  const width = 300;
  const height = 100;
  const maxDataValue = 100;
  const minDataValue = 0;

  const getX = (i: number) => (i / (data.length - 1)) * (width - 40) + 30;
  const getY = (d: number) => height - ((d - minDataValue) / (maxDataValue - minDataValue || 1)) * (height - 20) + 10;

  const dataPoints = data.map((d, i) => `${getX(i)},${getY(d)}`).join(' ');

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/30 p-6 rounded-lg col-span-2">
      <h3 className="text-neutral-400 text-sm mb-2">Vibe Trend</h3>
      <div className="flex items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" onMouseLeave={() => setHoveredPoint(null)}>
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Y-axis labels */}
          <text x="10" y="15" fill="white" fontSize="10" className="opacity-50">100</text>
          <text x="10" y={height - 5} fill="white" fontSize="10" className="opacity-50">0</text>

          <polyline
            fill="url(#trendGradient)"
            stroke="cyan"
            strokeWidth="2"
            points={`30,${height} ${dataPoints} ${width - 10},${height}`}
            style={{ filter: 'url(#glow)' }}
          />
          {data.map((d, i) => (
            <g key={i} onMouseEnter={() => setHoveredPoint({ index: i, value: d })}>
              <circle
                cx={getX(i)}
                cy={getY(d)}
                r="8"
                fill="transparent"
              />
              <circle
                cx={getX(i)}
                cy={getY(d)}
                r="3"
                fill="white"
              />
            </g>
          ))}
          {hoveredPoint && (
            <g>
              <rect
                x={getX(hoveredPoint.index) - 15}
                y={getY(hoveredPoint.value) - 30}
                width="30"
                height="20"
                rx="5"
                fill="rgba(0,0,0,0.7)"
              />
              <text
                x={getX(hoveredPoint.index)}
                y={getY(hoveredPoint.value) - 15}
                textAnchor="middle"
                fill="white"
                fontSize="10"
              >
                {hoveredPoint.value}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
