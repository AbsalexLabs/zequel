import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/section-label'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent plans for individual researchers, teams, and organizations. Start free.',
}

const PLANS = [
  {
    name: 'Researcher',
    price: '$0',
    cadence: '/ forever',
    description: 'For individuals starting evidence-backed research.',
    cta: 'Start free',
    href: '/auth/sign-up',
    featured: false,
    features: ['Up to 100 documents', 'Cited synthesis', 'Single workspace', 'Community support'],
  },
  {
    name: 'Professional',
    price: '$24',
    cadence: '/ month',
    description: 'For working researchers who need depth and speed.',
    cta: 'Start 14-day trial',
    href: '/auth/sign-up',
    featured: true,
    features: [
      'Unlimited documents',
      'Traceable reasoning trails',
      'Priority inference',
      'Export & API access',
      'Email support',
    ],
  },
  {
    name: 'Team',
    price: '$89',
    cadence: '/ month',
    description: 'For teams that need governance and accountability.',
    cta: 'Talk to us',
    href: '/site/contact',
    featured: false,
    features: [
      'Everything in Professional',
      'Role-based access control',
      'Audit logs & safety center',
      'Shared workspaces',
      'Dedicated support',
    ],
  },
]

const FAQ = [
  {
    q: 'Is there really a free tier?',
    a: 'Yes. The Researcher plan is free forever and includes cited synthesis across up to 100 documents — no credit card required.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade, downgrade, or cancel at any time from your workspace. Changes take effect immediately.',
  },
  {
    q: 'How does billing work for teams?',
    a: 'Team plans are billed per workspace with seats included. Reach out and we will tailor a plan to your organization.',
  },
  {
    q: 'Do you offer education or research discounts?',
    a: 'We do. Contact us with details about your institution and we will set you up with a discounted plan.',
  },
]

export default function PricingPage() {
  return (
    <>
      <PageHero
        label="Pricing"
        title="Plans that scale with the work"
        description="Start free and upgrade when your research demands more. Transparent pricing, no surprises."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col rounded-xl border bg-card p-8',
                plan.featured ? 'border-foreground shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)]' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {plan.name}
                </span>
                {plan.featured && (
                  <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-primary-foreground uppercase">
                    Popular
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="text-5xl font-semibold tracking-[-0.03em]">{plan.price}</span>
                <span className="mb-1.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                  {plan.cadence}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

              <Link
                href={plan.href}
                className={cn(
                  'mt-7 inline-flex h-11 items-center justify-center rounded-md font-mono text-xs tracking-[0.12em] uppercase transition-opacity hover:opacity-90',
                  plan.featured
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 flex flex-col gap-3.5 border-t border-border pt-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check size={17} className="mt-0.5 shrink-0 text-foreground" strokeWidth={2} />
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionLabel index="FAQ">Common questions</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border md:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q} className="flex flex-col gap-3 bg-card p-7" style={{ boxShadow: 'inset 0 0 0 0.5px var(--border)' }}>
                <h3 className="text-base font-medium">{item.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
