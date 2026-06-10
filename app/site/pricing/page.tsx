import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/section-label'
import { cn } from '@/lib/utils'
import { getPricingPlans, getFaq } from '@/lib/site/content'
import { PRICING_FALLBACK, PRICING_FAQ_FALLBACK } from '@/lib/site/fallbacks'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent plans for individual researchers, teams, and organizations. Start free.',
}

export const revalidate = 60

// Plans whose CTA should route to the contact page instead of sign-up.
const CONTACT_CTA = /talk|contact|sales|demo/i

function formatPrice(amount: number): { price: string; cadence: string } {
  if (!amount || amount <= 0) return { price: '$0', cadence: '/ forever' }
  return { price: `$${amount}`, cadence: '/ month' }
}

export default async function PricingPage() {
  const [plans, faq] = await Promise.all([
    getPricingPlans(PRICING_FALLBACK),
    getFaq(PRICING_FAQ_FALLBACK),
  ])

  return (
    <>
      <PageHero
        label="Pricing"
        title="Plans that scale with the work"
        description="Start free and upgrade when your research demands more. Transparent pricing, no surprises."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const { price, cadence } = formatPrice(plan.priceMonthly)
            const href = CONTACT_CTA.test(plan.ctaLabel) ? '/site/contact' : '/auth/sign-up'
            return (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col rounded-xl border bg-card p-8',
                  plan.highlighted ? 'border-foreground shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)]' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    {plan.name}
                  </span>
                  {plan.highlighted && (
                    <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-primary-foreground uppercase">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="text-5xl font-semibold tracking-[-0.03em]">{price}</span>
                  <span className="mb-1.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                    {cadence}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                <Link
                  href={href}
                  className={cn(
                    'mt-7 inline-flex h-11 items-center justify-center rounded-md font-mono text-xs tracking-[0.12em] uppercase transition-opacity hover:opacity-90',
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  {plan.ctaLabel}
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
            )
          })}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionLabel index="FAQ">Common questions</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border md:grid-cols-2">
            {faq.map((item) => (
              <div key={item.question} className="flex flex-col gap-3 bg-card p-7" style={{ boxShadow: 'inset 0 0 0 0.5px var(--border)' }}>
                <h3 className="text-base font-medium">{item.question}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
