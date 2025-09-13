import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-neutral-950 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex flex-col gap-8">
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={180}
          height={37}
          priority
        />
        <h1 className="text-4xl font-bold ml-4">Welcome to VYBE</h1>
        <div className="flex gap-8">
          <Link href="/dj" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-2xl">
            DJ Dashboard
          </Link>
          <Link href="/audience" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg text-2xl">
            Audience Voting
          </Link>
        </div>
      </div>
    </main>
  );
}
