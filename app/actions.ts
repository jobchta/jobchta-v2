'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'


export async function createApplication(jobId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to apply.' }
  }

  // 1. Get user's profile and current credit count
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, credits')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'You must complete your profile before applying.' };
  }

  // 2. Check if user has enough credits
  if (profile.credits === null || profile.credits <= 0) {
    return { error: 'You have no credits left.' };
  }

  // 3. Insert the application
  const { error: appError } = await supabase.from('applications').insert({
    job_id: jobId,
    user_id: user.id,
  })

  if (appError) {
    if (appError.code === '23505') { // unique_violation
        return { error: 'You have already applied for this job.' };
    }
    return { error: 'Could not submit application.' }
  }

  // 4. Decrement user's credits
  const newCreditCount = profile.credits - 1;
  const { error: creditError } = await supabase
    .from('profiles')
    .update({ credits: newCreditCount })
    .eq('id', user.id);

  if (creditError) {
    console.error("CRITICAL: Failed to decrement credits for user:", user.id);
    return { error: 'Application submitted, but failed to update credits.' };
  }

  revalidatePath('/')
  return { success: `Application submitted! ${newCreditCount} credits remaining.` }
}

// This function signature is updated
// In app/actions.ts
export async function updateProfile(
  previousState: { message: string },
  formData: FormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { return { message: 'ERROR: You must be logged in.' } }

  // Parse JSON data from the form, with error handling
  let workExperiences, skills;
  try {
    const workExpStr = formData.get('workExperiences') as string;
    workExperiences = workExpStr ? JSON.parse(workExpStr) : null;

    const skillsStr = formData.get('skills') as string;
    skills = skillsStr ? JSON.parse(skillsStr) : null;
  } catch (e) {
    return { message: 'ERROR: Invalid JSON format in Work Experiences or Skills.' };
  }

  const profileData = {
    full_name: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
    professional_summary: formData.get('professionalSummary') as string,
    work_experiences: workExperiences,
    skills: skills,
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