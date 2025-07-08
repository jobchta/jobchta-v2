import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// This function securely adds credits to a user's account
async function addCredits(userId: string, amount: number) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  
  // Using an RPC function is more secure and performant
  const { error } = await supabase.rpc('add_credits', {
    user_id_to_update: userId,
    amount_to_add: amount
  })

  if (error) {
    throw new Error(`Failed to call add_credits function: ${error.message}`)
  }
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  
  try {
    const rawBody = await req.text()
    const hmac = crypto.createHmac('sha256', secret)
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8')
    const signature = Buffer.from(req.headers.get('X-Signature') || '', 'utf8')

    // Securely verify the request came from Lemon Squeezy
    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error('Invalid signature.')
    }

    const body = JSON.parse(rawBody)

    // Check for the 'order_created' event
    if (body.meta.event_name === 'order_created') {
      const userId = body.meta.custom_data?.user_id
      const variantId = body.data.attributes.first_order_item.variant_id

      if (!userId) throw new Error('No user_id in custom_data')

      let creditsToAdd = 0;
      // IMPORTANT: Replace these placeholder IDs with your actual Variant IDs from Lemon Squeezy
      if (variantId === 891468) creditsToAdd = 50;  // Starter Pack
      if (variantId === 891482) creditsToAdd = 150; // Pro Pack
      if (variantId === 891483) creditsToAdd = 500; // Mega Pack

      if (creditsToAdd > 0) {
        await addCredits(userId, creditsToAdd)
        console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 })
  }
}
