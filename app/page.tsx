import { AuthButton } from '@/components/AuthButton'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import JobCard, { type Job } from '@/components/dashboard/JobCard'
import { createClient } from '@/lib/supabase/server'

export default async function Index({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const searchQuery = searchParams?.q || '';

    // Start building the query
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // If there is a search query, add a filter
    if (searchQuery) {
      // Use 'ilike' for case-insensitive search on the 'title' column
      query = query.ilike('title', `%${searchQuery}%`);
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

        {/* Search Form */}
        <div className="mb-6">
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by job title..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md"
            >
              Search
            </button>
          </form>
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