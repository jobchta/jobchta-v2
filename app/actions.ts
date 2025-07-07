'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// This function is unchanged
export async function createApplication(jobId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to apply.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'You must complete your profile before applying.' };
  }

  const { error } = await supabase.from('applications').insert({
    job_id: jobId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
        return { error: 'You have already applied for this job.' };
    }
    return { error: 'Could not apply for this job.' }
  }

  revalidatePath('/')
  return { success: 'Application submitted!' }
}

// This function signature is updated
export async function updateProfile(



  previousState: { message: string },
  formData: FormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'ERROR: You must be logged in to update your profile.' }
  }

  const profileData = {
    full_name: formData.get('fullName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    resume_url: formData.get('resumeUrl') as string,
    updated_at: new Date(),
  }

  const { error } = await supabase.from('profiles').upsert({ ...profileData, id: user.id })

  if (error) {
    console.error('Error updating profile:', error)
    return { message: 'ERROR: Could not update profile.' }
  }

  revalidatePath('/profile')
  return { message: 'SUCCESS: Profile updated successfully!' }
}