"use client"

import { useState } from "react"
import { PageHero } from "@/components/site/page-hero"
import { SectionLabel } from "@/components/site/section-label"
import { Mail, MessageSquare, MapPin } from "lucide-react"

const channels = [
  { icon: Mail, label: "Email", value: "hello@zequel.xyz", href: "mailto:hello@zequel.xyz" },
  { icon: MessageSquare, label: "Support", value: "support@zequel.xyz", href: "mailto:support@zequel.xyz" },
  { icon: MapPin, label: "Location", value: "Remote-first / Global", href: null },
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", message: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      setSent(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        label="Contact"
        title="Let's talk about your research"
        description="Questions about the platform, pricing, or a custom deployment? Send a note and the team will get back within one business day."
      />

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-2">
          {/* Form */}
          <div className="bg-background p-8 md:p-12">
            <SectionLabel>Send a message</SectionLabel>
            {sent ? (
              <div className="mt-8 border border-border bg-muted/40 p-6">
                <p className="font-mono text-sm uppercase tracking-wider text-foreground">Message received</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Thanks for reaching out. We&apos;ll reply to your inbox shortly.
                </p>
              </div>
            ) : (
              <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-11 border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="h-11 border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="resize-none border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 inline-flex h-11 items-center justify-center bg-foreground px-6 font-mono text-xs uppercase tracking-wider text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* Channels */}
          <div className="bg-background p-8 md:p-12">
            <SectionLabel>Direct channels</SectionLabel>
            <div className="mt-8 flex flex-col">
              {channels.map((c) => {
                const Icon = c.icon
                const inner = (
                  <div className="flex items-center gap-4 border-b border-border py-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
                      <span className="text-sm text-foreground">{c.value}</span>
                    </div>
                  </div>
                )
                return c.href ? (
                  <a key={c.label} href={c.href} className="transition-colors hover:bg-muted/40">
                    {inner}
                  </a>
                ) : (
                  <div key={c.label}>{inner}</div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
