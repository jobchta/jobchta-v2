import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClientComponent from './ProfileClientComponent'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ProfileClientComponent user={user} profile={profile} />
}