'use client'

import { createClient } from "@/lib/supabase/client"
import { type User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { useFormState, useFormStatus } from 'react-dom'
import { updateProfile } from "@/app/actions";
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md disabled:bg-gray-500 transition-colors duration-200"
    >
      {pending ? 'Saving...' : 'Save Profile'}
    </button>
  )
}

type Profile = {
  id: string;
  updated_at: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  resume_url: string | null;
} | null;


export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true);

  const initialState = { message: '' };
  const [state, formAction] = useFormState(updateProfile, initialState)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false);
    }
    fetchUserProfile()
  }, [])

  if (loading) {
    return <DashboardLayout><p>Loading profile...</p></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">Back to Dashboard</Link>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg">
        <p className="text-gray-400 mb-8">
          This information will be used by the bot to auto-apply for jobs.
        </p>

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={profile?.email || ''}
              disabled
              className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              defaultValue={profile?.full_name || ''}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              type="text"
              name="phone"
              id="phone"
              defaultValue={profile?.phone || ''}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
           <div>
            <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-300 mb-2">Resume URL (must be a public link)</label>
            <input
              type="text"
              name="resumeUrl"
              id="resumeUrl"
              defaultValue={profile?.resume_url || ''}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <SubmitButton />
            {state?.message && (
              <p className={state.message.startsWith('ERROR') ? 'text-red-400' : 'text-green-400'}>
                {state.message.replace('SUCCESS: ', '').replace('ERROR: ', '')}
              </p>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}