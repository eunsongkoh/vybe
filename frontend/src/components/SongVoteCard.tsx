'use client';

import React, { useState } from 'react';

const UpArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const DownArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);


interface SongVoteCardProps {
  songName: string;
}

const SongVoteCard: React.FC<SongVoteCardProps> = ({ songName }) => {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  const handleUpvote = () => setUpvotes(prev => prev + 1);
  const handleDownvote = () => setDownvotes(prev => prev + 1);

  return (
    <div 
      className="bg-opacity-50 backdrop-blur-lg rounded-3xl p-8 text-white w-full max-w-sm shadow-2xl border border-slate-700"
      style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(51, 65, 85, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)'
      }}
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">{songName}</h2>
      </div>

      <div className="flex justify-around items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-sm font-semibold">Downvote</span>
          <button 
            onClick={handleDownvote}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-full w-24 h-24 flex items-center justify-center transition-colors shadow-lg"
          >
            <DownArrowIcon />
          </button>
          <span className="font-bold text-2xl text-slate-300">{downvotes}</span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-sm font-semibold">Upvote</span>
          <button 
            onClick={handleUpvote}
            className="bg-white hover:bg-slate-200 text-slate-900 rounded-full w-24 h-24 flex items-center justify-center transition-colors shadow-lg"
          >
            <UpArrowIcon />
          </button>
          <span className="font-bold text-2xl text-slate-300">{upvotes}</span>
        </div>
      </div>
    </div>
  );
};

export default SongVoteCard;
