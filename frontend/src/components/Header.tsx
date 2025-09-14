'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden bg-neutral-900 p-4 flex justify-between items-center">
      <Link href="/home">
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={80}
          height={16}
        />
      </Link>
      <button onClick={onMenuClick} className="text-white">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </header>
  );
}
