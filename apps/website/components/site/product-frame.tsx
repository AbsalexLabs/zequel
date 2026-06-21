import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Browser-chrome frame for product screenshots.
 * Gives screenshots a premium, intentional presentation
 * with a mono URL bar — stays strictly black & white.
 */
export function ProductFrame({
  src,
  srcDark,
  videoSrc,
  poster,
  alt,
  label,
  className,
  priority,
}: {
  src?: string
  /** Optional dark-mode screenshot. When provided, it is shown in dark mode and `src` in light mode. */
  srcDark?: string
  /** Optional video source. When provided, an autoplaying, muted, looping video is rendered instead of an image. */
  videoSrc?: string
  /** Poster image shown before the video loads, for fast perceived load. */
  poster?: string
  alt: string
  label?: string
  className?: string
  priority?: boolean
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_0_0_var(--border),0_24px_60px_-30px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md border border-border bg-background px-3">
          <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
            {label ?? 'zequel.xyz/workspace'}
          </span>
        </div>
      </div>
      {videoSrc ? (
        <video
          className="h-auto w-full"
          src={videoSrc}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={alt}
        />
      ) : (
        <>
          <Image
            src={src || '/placeholder.svg'}
            alt={alt}
            width={1440}
            height={900}
            priority={priority}
            className={cn('h-auto w-full', srcDark && 'dark:hidden')}
          />
          {srcDark && (
            <Image
              src={srcDark}
              alt={alt}
              width={1440}
              height={900}
              priority={priority}
              className="hidden h-auto w-full dark:block"
            />
          )}
        </>
      )}
    </figure>
  )
}
