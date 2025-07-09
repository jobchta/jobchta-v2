import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    priceSuffix: '/ month',
    features: [
      '5 Auto-Applies per month',
      'Standard Job Matching',
      '24-hour delay on new jobs',
    ],
    buttonText: 'You are on this plan',
    buttonLink: '#',
    isCurrent: true,
  },
  {
    name: 'Basic',
    price: '$10',
    priceSuffix: '/ month',
    features: [
      'Unlimited Auto-Applies',
      'AI Resume Keyword Scan',
      'Instant access to new jobs',
      'Email support',
    ],
    buttonText: 'Upgrade to Basic',
    buttonLink: 'https://jobchta.lemonsqueezy.com/buy/571d8604-1a4e-48b9-a57a-a5be4f41618b',
    isCurrent: false,
  },
  {
    name: 'Pro',
    price: '$25',
    priceSuffix: '/ month',
    features: [
      'Everything in Basic, plus:',
      'Priority Applications (when available)',
      'Application Analytics',
      'AI Interview Practice (Coming Soon)',
    ],
    buttonText: 'Upgrade to Pro',
    buttonLink: 'https://jobchta.lemonsqueezy.com/buy/d5920a52-8b4a-4701-b6d6-d913c5a2a104',
    isCurrent: false,
  },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('credits, tier').single();

  return (
    <DashboardLayout credits={profile?.credits ?? 0}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Find the Plan That’s Right for You</h1>
        <p className="text-gray-400 mt-2">Start for free, or unlock the full power of AI.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier) => {
          const isUserTier = profile?.tier === tier.name.toLowerCase();
          return (
            <div key={tier.name} className={`bg-gray-800 p-8 rounded-lg border-2 ${tier.name === 'Basic' ? 'border-indigo-500' : 'border-gray-700'}`}>
              <h2 className="text-2xl font-semibold">{tier.name}</h2>
              <p className="mt-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-400">{tier.priceSuffix}</span>
              </p>
              <ul className="mt-6 space-y-2 text-gray-300">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <span>✅</span> {feature}
                  </li>
                ))}
              </ul>
              <a
                href={isUserTier ? '#' : `${tier.buttonLink}?checkout[custom][user_id]=${user.id}`}
                className={`mt-8 block w-full text-center py-2 px-4 rounded-md font-semibold ${
                  isUserTier
                    ? 'bg-gray-600 text-gray-400 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isUserTier ? 'Your Current Plan' : tier.buttonText}
              </a>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  );
}
