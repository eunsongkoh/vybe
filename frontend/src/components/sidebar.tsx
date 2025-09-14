import Image from 'next/image';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-neutral-900 p-6 z-20 transition-transform transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0 lg:col-span-1`}
    >
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
