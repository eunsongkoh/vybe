import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={180}
          height={37}
          priority
        />
        <h1 className="text-4xl font-bold ml-4">Home Page</h1>
      </div>
    </main>
  );
}
