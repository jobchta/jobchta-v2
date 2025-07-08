import { AuthButton } from '@/components/AuthButton'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import JobCard, { type Job } from '@/components/dashboard/JobCard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Index({
  searchParams,
}: {
  searchParams?: { 
    q?: string;
    time?: 'hour' | 'day' | 'week';
  };
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const searchQuery = searchParams?.q || '';
    const timeFilter = searchParams?.time;

    // Start building the query
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Increased limit for filtering

    // Add search filter if it exists
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Add time filter if it exists
    if (timeFilter) {
      const now = new Date();
      let timeAgo;
      if (timeFilter === 'hour') {
        timeAgo = new Date(now.setHours(now.getHours() - 1)).toISOString();
      } else if (timeFilter === 'day') {
        timeAgo = new Date(now.setDate(now.getDate() - 1)).toISOString();
      } else if (timeFilter === 'week') {
        timeAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
      }
      if (timeAgo) {
        query = query.gte('created_at', timeAgo);
      }
    }

    // Execute the final query
    const { data: jobs } = await query;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .single();

    return (
      <DashboardLayout credits={profile?.credits ?? 0}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Live Jobs Feed</h1>
          <AuthButton />
        </div>

        {/* Search & Filter UI */}
        <div className="mb-6 space-y-4">
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by job title..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md"
            >
              Search
            </button>
          </form>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Filter by:</span>
            <Link href="/" className={!timeFilter ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}>All</Link>
            <Link href="/?time=hour" className={timeFilter === 'hour' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}>Past Hour</Link>
            <Link href="/?time=day" className={timeFilter === 'day' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}>Past 24 Hours</Link>
            <Link href="/?time=week" className={timeFilter === 'week' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}>Past Week</Link>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((job: Job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <p className="text-gray-400">No jobs found for your search criteria.</p>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Logged-out view
  return (
    <div className="flex-1 w-full flex flex-col items-center">
       <nav className="w-full h-16 border-b border-b-foreground/10 flex justify-center">
          <div className="w-full max-w-4xl flex justify-end items-center p-3 text-sm">
            <AuthButton />
          </div>
        </nav>
        <main className="flex-1 flex flex-col gap-6 items-center justify-center">
          <h1 className="text-5xl font-bold">JobCHTA.ai</h1>
          <p className="text-xl">The last job search you&apos;ll ever do. Log in to get started.</p>
        </main>
    </div>
  )
}