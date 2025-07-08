import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Define the pricing packages
const creditPacks = [
  { 
    name: 'Starter', 
    price: '$5', 
    credits: 50, 
    perCredit: 0.10, 
    bestFor: 'Casual users',
    hook: 'Just $5 to start',
    // PASTE YOUR LEMON SQUEEZY CHECKOUT LINK HERE
    checkoutLink: 'https://jobchta.lemonsqueezy.com/buy/2b0ca56e-1961-4836-a751-60ad53b5cd69' 
  },
  { 
    name: 'Pro', 
    price: '$12', 
    credits: 150, 
    perCredit: 0.08, 
    bestFor: 'Most popular 🏆',
    hook: '20% savings!',
    // PASTE YOUR LEMON SQUEEZY CHECKOUT LINK HERE
    checkoutLink: 'https://jobchta.lemonsqueezy.com/buy/9188ca27-8f00-4ae1-a153-c6e4ae431702' 
  },
  { 
    name: 'Mega', 
    price: '$35', 
    credits: 500, 
    perCredit: 0.07, 
    bestFor: 'Power users',
    hook: '30% bonus!',
    // PASTE YOUR LEMON SQUEEZY CHECKOUT LINK HERE
    checkoutLink: 'https://jobchta.lemonsqueezy.com/buy/4181bed7-d125-44de-8e26-9135c846ab5e'

  },
];

export default async function BuyCreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('credits').single();
  const currentCredits = profile?.credits ?? 0;

  return (
    <DashboardLayout credits={currentCredits}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Get More Credits</h1>
      </div>

      {/* FOMO Warning based on your design */}
      {currentCredits <= 2 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-6 text-yellow-800 rounded-r-lg">
          <p className="font-bold">🔥 You have {currentCredits} credits left! Get more to keep applying.</p>
        </div>
      )}

      {/* Dynamic Pricing Table */}
      <div className="grid md:grid-cols-3 gap-6 text-center">
        {creditPacks.map(pack => (
          <div key={pack.name} className={`bg-gray-800 p-6 rounded-lg border-2 ${pack.name === 'Pro' ? 'border-indigo-500' : 'border-gray-700'}`}>
            <h2 className="text-2xl font-semibold">{pack.name}</h2>
            <p className="text-indigo-400 mt-1 h-10">{pack.bestFor}</p>
            <p className="text-5xl font-bold my-4">{pack.price}</p>
            <p className="text-gray-400">{pack.credits} Credits</p>
            <p className="text-gray-500 text-sm">(${pack.perCredit.toFixed(2)}/credit)</p>
            <a 
              // This dynamically adds the user's ID to the checkout link
              href={`${pack.checkoutLink}?checkout[custom][user_id]=${user.id}`}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md w-full block text-center transition-transform transform hover:scale-105"
            >
              {pack.hook}
            </a>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
