export default function AudiencePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 text-white overflow-hidden">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold mb-8">Vote on the Vibe</h1>
        <div className="bg-neutral-900 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">6 7 - Y Comb Remix</h2>
          <div className="flex gap-8">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-2xl">
              👍
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-2xl">
              👎
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
