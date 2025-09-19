import FaultyTerminal from '@/components/FaultyTerminal';

export default function BackgroundPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <FaultyTerminal className="" style={{}} dpr={null} scale={3} brightness={0.3} />
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-8">
        {/* Content can be added here */}
      </div>
    </main>
  );
}
