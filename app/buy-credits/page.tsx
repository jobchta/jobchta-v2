import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BuyCreditsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // This is the checkout link you copied from Lemon Squeezy
  const checkoutLink = "https://jobchta.lemonsqueezy.com/buy/75a8b3b7-9481-438f-851a-ed1231cf0bfc";

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .single();

  return (
    <DashboardLayout credits={profile?.credits ?? 0}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buy More Credits</h1>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-center">50 Credits</h2>
        <p className="text-center text-gray-400 mt-2">Get 50 more auto-applies for your job search.</p>
        <p className="text-5xl font-bold text-center my-6">$5.00</p>
        <a 
          href={checkoutLink} 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md w-full block text-center"
        >
          Buy Now
        </a>
      </div>
    </DashboardLayout>
  );
}