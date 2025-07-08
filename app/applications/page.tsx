import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Link from "next/link";

// Helper component to style the status badges
const StatusBadge = ({ status }: { status: string | null }) => {
  let color = 'bg-gray-500'; // Default
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

  // Fetch the user's applications, joining with job details
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      created_at,
      status,
      details,
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

      <div className="bg-gray-800 rounded-lg">
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4">Job Title</th>
              <th className="p-4">Company</th>
              <th className="p-4">Submitted</th>
              <th className="p-4">Status</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {applications && applications.length > 0 ? (
              applications.map((app: any) => (
                <tr key={app.id} className="border-b border-gray-700">
                  <td className="p-4">
                    <a href={app.jobs.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {app.jobs.title}
                    </a>
                  </td>
                  <td className="p-4 text-gray-400">{app.jobs.company}</td>
                  <td className="p-4 text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="p-4"><StatusBadge status={app.status} /></td>
                  <td className="p-4 text-gray-500 text-sm">{app.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-400">
                  You have not submitted any applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}