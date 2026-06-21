import { SectionLabel } from '@/components/site/section-label'
import { ProductFrame } from '@/components/site/product-frame'
import { cn } from '@/lib/utils'

type ShowcaseItem = {
  label: string
  title: string
  body: string
  src: string
  srcDark?: string
  alt: string
  url: string
  points: string[]
}

const SHOWCASE: ShowcaseItem[] = [
  {
    label: 'Study Workspace',
    title: 'Your entire study, in one interface',
    body: 'The study workspace brings documents, evidence, and an AI chat into a single focused view. Read source material on one side, ask questions on the other, and every answer stays anchored to the passages it came from.',
    src: '/site/workspace-light.jpg',
    srcDark: '/site/workspace-dark.jpg',
    alt: 'Zequel study workspace showing a document alongside an evidence-backed AI chat',
    url: 'zequel.xyz/workspace/overview',
    points: ['Documents and chat side by side', 'Answers anchored to evidence', 'Everything saved to your study'],
  },
  {
    label: 'Safety Center',
    title: 'Accountability, by default',
    body: 'Every flagged response, every policy trigger, every review — captured and traceable. Research you can stand behind.',
    src: '/site/product-safety.png',
    alt: 'Zequel safety center showing flags and review queue',
    url: 'zequel.xyz/workspace/safety',
    points: ['Automated safety flags', 'Full audit trail', 'Role-based review queue'],
  },
  {
    label: 'Membership',
    title: 'Plans that scale with the work',
    body: 'Grant, change, or revoke access and review billing history without leaving the workspace.',
    src: '/site/product-subscriptions.png',
    alt: 'Zequel subscriptions page showing recurring revenue trend',
    url: 'zequel.xyz/workspace/subscriptions',
    points: ['Flexible plan management', 'Recurring revenue trends', 'One-click exports'],
  },
]

export function ProductShowcase() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionLabel index="02">The Product</SectionLabel>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Built like an instrument, not a chatbot
          </h2>
        </div>

        <div className="mt-16 flex flex-col gap-24">
          {SHOWCASE.map((item, i) => (
            <div
              key={item.title}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={cn('flex flex-col gap-5', i % 2 === 1 && 'lg:order-2')}>
                <SectionLabel>{item.label}</SectionLabel>
                <h3 className="text-balance text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{item.title}</h3>
                <p className="text-pretty leading-relaxed text-muted-foreground">{item.body}</p>
                <ul className="mt-2 flex flex-col gap-3">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                      </span>
                      <span className="text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn(i % 2 === 1 && 'lg:order-1')}>
                <ProductFrame src={item.src} srcDark={item.srcDark} alt={item.alt} label={item.url} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
