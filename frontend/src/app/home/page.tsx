import Image from 'next/image';
import Link from 'next/link';
import FaultyTerminal from '@/components/FaultyTerminal';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <FaultyTerminal className="" style={{}} dpr={null} scale={3} brightness={0.3} />
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={180}
          height={37}
          priority
        />
        <h1 className="text-4xl font-semibold ml-4 tracking-wider">Welcome to VYBE</h1>
        <div className="flex gap-8">
          <Link href="/dj" className="font-sans bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white font-normal py-3 px-6 rounded-full text-lg shadow-lg shadow-white/10 transform hover:scale-105 transition-all duration-300 tracking-wide">
            DJ Dashboard
          </Link>
          <Link href="/audience" className="font-sans bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white font-normal py-3 px-6 rounded-full text-lg shadow-lg shadow-white/10 transform hover:scale-105 transition-all duration-300 tracking-wide">
            Audience Voting
          </Link>
        </div>
      </div>
    </main>
  );
}
