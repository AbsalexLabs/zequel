/**
 * Background texture for the marketing site.
 * Subtle hairline grid + faint film grain — keeps the black & white
 * brand from feeling flat or "dev-like" without introducing color.
 * Self-contained (inline styles) so the /site folder is portable.
 */
export function SiteTexture() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 100% 70% at 50% 0%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 70% at 50% 0%, black 30%, transparent 90%)',
        }}
      />
      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
