import { AuthButton } from '@/components/AuthButton'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import JobCard, { type Job } from '@/components/dashboard/JobCard'
import { createClient } from '@/lib/supabase/server'

export default async function Index() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .single()

    return (
      <DashboardLayout credits={profile?.credits ?? 0}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Live Jobs Feed</h1>
          <AuthButton />
        </div>
        <div className="space-y-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((job: Job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <p className="text-gray-400">No jobs found. Run your scraper.</p>
          )}
        </div>
      </DashboardLayout>
    )
  }

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