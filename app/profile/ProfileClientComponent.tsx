'use client'

import { type User } from "@supabase/supabase-js"
import { useFormState, useFormStatus } from 'react-dom'
import { updateProfile } from "@/app/actions"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import Link from "next/link"
import { type ComponentProps } from 'react'

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

// THIS IS THE CORRECTED TYPE DEFINITION
type Profile = {
  id: string;
  updated_at: string;
  credits: number | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  resume_url: string | null;
  professional_summary: string | null; // Added
  work_experiences: any | null;        // Added
  skills: any | null;                  // Added
} | null;

export default function ProfileClientComponent({ user, profile }: { user: User, profile: Profile }) {
  const initialState = { message: '' };
  const [state, formAction] = useFormState(updateProfile, initialState)

  return (
    <DashboardLayout credits={profile?.credits ?? 0}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Professional Profile</h1>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg">
        <p className="text-gray-400 mb-8">
          Provide detailed information here. The AI will use it to build custom resumes.
        </p>
        <form action={formAction} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input type="text" name="fullName" id="fullName" defaultValue={profile?.full_name || ''} className="w-full bg-gray-700 rounded-md p-2 text-white"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" name="email" id="email" defaultValue={profile?.email || ''} disabled className="w-full bg-gray-900 rounded-md p-2 text-gray-400"/>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input type="text" name="phone" id="phone" defaultValue={profile?.phone || ''} className="w-full bg-gray-700 rounded-md p-2 text-white"/>
          </div>
          {/* Professional Summary */}
          <div>
            <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-300 mb-2">Professional Summary</label>
            <textarea name="professionalSummary" id="professionalSummary" rows={3} defaultValue={profile?.professional_summary || ''} className="w-full bg-gray-700 rounded-md p-2 text-white" placeholder="A brief 2-3 sentence summary of your career..."></textarea>
          </div>
          {/* Work Experience */}
          <div>
            <label htmlFor="workExperiences" className="block text-sm font-medium text-gray-300 mb-2">Work Experiences (JSON format)</label>
            <textarea name="workExperiences" id="workExperiences" rows={10} defaultValue={profile?.work_experiences ? JSON.stringify(profile.work_experiences, null, 2) : ''} className="w-full bg-gray-700 rounded-md p-2 font-mono text-sm text-white" placeholder={`[
  {
    "title": "Software Engineer",
    "company": "Google",
    "dates": "Jan 2022 - Present",
    "duties": ["Developed feature X.", "Led project Y."]
  }
]`}></textarea>
          </div>
          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-300 mb-2">Skills (JSON format)</label>
            <textarea name="skills" id="skills" rows={5} defaultValue={profile?.skills ? JSON.stringify(profile.skills, null, 2) : ''} className="w-full bg-gray-700 rounded-md p-2 font-mono text-sm text-white" placeholder={`[ "JavaScript", "React", "Node.js", "SQL" ]`}></textarea>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <SubmitButton />
            {state?.message && ( <p className={state.message.startsWith('ERROR') ? 'text-red-400' : 'text-green-400'}>{state.message.replace(/SUCCESS: |ERROR: /g, '')}</p> )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}