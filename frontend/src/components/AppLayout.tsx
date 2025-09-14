'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-5 min-h-screen text-white ${
        isSidebarOpen ? 'sidebar-open' : ''
      }`}
    >
      <Header onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className="lg:col-span-4 flex flex-col items-center justify-center p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}
