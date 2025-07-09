import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Database function to add credits (unchanged)
async function addCredits(supabase: any, userId: string, amount: number) {
  const { error } = await supabase.rpc('add_credits', {
    user_id_to_update: userId,
    amount_to_add: amount
  })
  if (error) throw new Error(`Failed to call add_credits function: ${error.message}`)
}

// New database function to update a user's subscription tier
async function updateUserTier(supabase: any, userId: string, tier: string, status: string, subId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      tier: tier,
      subscription_id: subId,
      subscription_status: status,
      credits: null // Subscriptions grant unlimited applies
    })
    .eq('id', userId)
  if (error) throw new Error(`Failed to update user tier: ${error.message}`)
}

export async function POST(req: Request) {
  const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  
  try {
    const rawBody = await req.text()
    const hmac = crypto.createHmac('sha256', secret)
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8')
    const signature = Buffer.from(req.headers.get('X-Signature') || '', 'utf8')

    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error('Invalid signature.')
    }

    const body = JSON.parse(rawBody)
    const eventName = body.meta.event_name
    const userId = body.meta.custom_data?.user_id

    if (!userId) {
      throw new Error('Webhook received without a user_id in custom_data.')
    }

    // --- ROUTE WEBHOOK BASED ON EVENT ---
    
    // Handle one-time credit purchases
    if (eventName === 'order_created') {
      const variantId = body.data.attributes.first_order_item.variant_id;
      let creditsToAdd = 0;
      // IMPORTANT: Replace with your actual Variant IDs for CREDIT PACKS
      if (variantId === 891468) creditsToAdd = 50;
      if (variantId === 891482) creditsToAdd = 150;
      if (variantId === 891483) creditsToAdd = 500;

      if (creditsToAdd > 0) {
        await addCredits(supabaseAdmin, userId, creditsToAdd)
        console.log(`CREDITS: Added ${creditsToAdd} credits to user ${userId}`)
      }
    }

    // Handle new subscriptions or plan changes
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const variantId = body.data.attributes.variant_id;
      const status = body.data.attributes.status; // e.g., "active", "cancelled"
      const subId = body.data.id;
      let tier = 'free';

      // IMPORTANT: Replace with your actual Variant IDs for SUBSCRIPTIONS
      if (variantId === 892969) tier = 'basic';
      if (variantId === 892970) tier = 'pro';
      
      await updateUserTier(supabaseAdmin, userId, tier, status, subId)
      console.log(`SUBSCRIPTION: Updated user ${userId} to ${tier} tier with status ${status}.`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 })
  }
}
