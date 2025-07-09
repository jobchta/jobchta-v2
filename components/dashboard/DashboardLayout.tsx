'use client'

import Link from 'next/link'

export default function DashboardLayout({ 
  children, 
  credits 
}: { 
  children: React.ReactNode,
  credits: number | null 
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white w-full">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-800 p-6 hidden md:block flex-col">
          <nav className="flex-1">
            <ul>
              <li className="mb-4">
                <Link href="/" className="text-lg font-bold text-white bg-gray-700 p-2 rounded-md block">
                  Dashboard
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/applications" className="text-lg text-gray-400 hover:text-white">
                  Applications
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/profile" className="text-lg text-gray-400 hover:text-white">
                  Profile
                </Link>
              </li>
              {/* ADD THESE TWO NEW LINKS */}
              <li className="mb-4">
                <Link href="/pricing" className="text-lg text-gray-400 hover:text-white">
                  Upgrade Plan
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/buy-credits" className="text-lg text-gray-400 hover:text-white">
                  Buy Credits
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="mt-auto">
            <p className="text-sm text-gray-400">Credits Remaining</p>
            <p className="text-2xl font-bold">{credits !== null ? credits : 'N/A'}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}