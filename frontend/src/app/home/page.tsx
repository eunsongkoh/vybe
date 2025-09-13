import Image from 'next/image';
import Link from 'next/link';
import FaultyTerminal from '@/components/FaultyTerminal';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <FaultyTerminal className="" style={{}} dpr={null} scale={3} brightness={0.1} />
      </div>
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
