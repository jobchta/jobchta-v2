import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClientComponent from './ProfileClientComponent'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile data on the server
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Pass the initial data to the client component
  return <ProfileClientComponent user={user} profile={profile} />
}