import { SectionLabel } from '@/components/site/section-label'

export function PageHero({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description: string
}) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-14 sm:px-6 sm:pt-24 lg:px-8">
        <div className="flex flex-col gap-5">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}
