import Image from 'next/image';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="col-span-1 bg-neutral-900 p-6">
      <Link href="/home">
        <div className="flex items-center gap-2 mb-10">
          <Image
            src="/vybe logo white.svg"
            alt="Vybe Logo"
            width={100}
            height={20}
          />
        </div>
      </Link>
      <nav>
        <ul>
          <li className="mb-4">
            <a href="/dj" className="text-neutral-400 hover:text-white">DJ Dashboard</a>
          </li>
          <li className="mb-4">
            <a href="/audience" className="text-neutral-400 hover:text-white">Audience Voting</a>
          </li>
          {/* Add more navigation items here */}
        </ul>
      </nav>
    </aside>
  );
}
