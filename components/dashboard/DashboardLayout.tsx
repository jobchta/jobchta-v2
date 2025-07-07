import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-800 p-6 hidden md:block">
          <nav>
            <ul>
              <li className="mb-4">
                <Link href="/" className="text-lg font-bold text-white bg-gray-700 p-2 rounded-md block">
                  Dashboard
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/profile" className="text-lg text-gray-400 hover:text-white">
                  Profile
                </Link>
              </li>
              <li className="mb-4">
                <a href="#" className="text-lg text-gray-400 hover:text-white">Account</a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}