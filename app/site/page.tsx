import { Hero } from '@/components/site/hero'
import { StatsBand } from '@/components/site/stats-band'
import { FeatureGrid } from '@/components/site/feature-grid'
import { ProductShowcase } from '@/components/site/product-showcase'
import { HowItWorks } from '@/components/site/how-it-works'
import { Testimonials } from '@/components/site/testimonials'
import { CtaSection } from '@/components/site/cta-section'

export default function SiteHomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <FeatureGrid />
      <ProductShowcase />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  )
}
