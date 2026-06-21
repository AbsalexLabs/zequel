import Image from 'next/image'
import { SectionLabel } from '@/components/site/section-label'
import { getTestimonials } from '@/lib/site/content'
import { HOME_TESTIMONIALS_FALLBACK } from '@/lib/site/fallbacks'

export async function Testimonials() {
  const testimonials = await getTestimonials(HOME_TESTIMONIALS_FALLBACK)

  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionLabel index="05">Voices</SectionLabel>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Trusted by people who can&apos;t afford to be wrong
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between gap-8 rounded-xl border border-border bg-card p-7"
            >
              <blockquote className="text-pretty leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-3">
                {t.avatar ? (
                  <Image
                    src={t.avatar || '/placeholder.svg'}
                    alt={t.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-medium text-muted-foreground"
                  >
                    {t.name.charAt(0)}
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
