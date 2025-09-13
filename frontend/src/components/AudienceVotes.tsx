interface AudienceVotesProps {
  upvotes: number;
  downvotes: number;
}

export default function AudienceVotes({ upvotes, downvotes }: AudienceVotesProps) {
  const totalVotes = upvotes + downvotes;
  const upvotePercentage = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-2">Audience Votes</h3>
      <div className="flex items-center gap-4">
        <div className="text-green-500">
          <span className="font-bold text-2xl">{upvotes}</span> 👍
        </div>
        <div className="text-red-500">
          <span className="font-bold text-2xl">{downvotes}</span> 👎
        </div>
      </div>
      <div className="w-full bg-neutral-700 rounded-full h-2.5 mt-4">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${upvotePercentage}%` }}></div>
      </div>
    </div>
  );
}
