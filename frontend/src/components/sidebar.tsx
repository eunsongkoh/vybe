import Image from 'next/image';

export default function Sidebar() {
  return (
    <aside className="col-span-1 bg-neutral-900 p-6">
      <div className="flex items-center gap-2 mb-10">
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={100}
          height={20}
        />
      </div>
      <nav>
        <ul>
          <li className="mb-4">
            <a href="#" className="text-neutral-400 hover:text-white">Overview</a>
          </li>
          {/* Add more navigation items here */}
        </ul>
      </nav>
    </aside>
  );
}
