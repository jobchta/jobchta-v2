import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let credits: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .single();
    credits = profile?.credits ?? 0;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
                <Link href="/profile" className="text-lg text-gray-400 hover:text-white">
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Credit Display */}
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