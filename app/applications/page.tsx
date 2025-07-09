import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const StatusBadge = ({ status }: { status: string | null }) => {
  let color = 'bg-gray-500';
  if (status === 'completed') color = 'bg-green-500';
  if (status === 'failed') color = 'bg-red-500';
  if (status === 'skipped') color = 'bg-yellow-500';

  return (
    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${color}`}>
      {status || 'pending'}
    </span>
  );
};

export default async function ApplicationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      created_at,
      status,
      details,
      generated_text, 
      jobs ( title, company, url )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .single();

  return (
    <DashboardLayout credits={profile?.credits ?? 0}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Application History</h1>
      </div>

      <div className="space-y-4">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <div key={app.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <a href={app.jobs.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:underline">
                    {app.jobs.title}
                  </a>
                  <p className="text-gray-400">{app.jobs.company}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              {app.generated_text && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-md border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300">AI Generated Summary:</h4>
                  <p className="text-sm text-gray-400 mt-1 italic">
                    "{app.generated_text}"
                  </p>
                </div>
              )}
               <p className="text-xs text-gray-500 mt-2">
                Submitted: {new Date(app.created_at).toLocaleString()} | Details: {app.details}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center p-8 text-gray-400 bg-gray-800 rounded-lg">
            You have not submitted any applications yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
