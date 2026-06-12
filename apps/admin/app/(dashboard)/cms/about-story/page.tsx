"use client"

import { useEffect, useState } from "react"
import { Save, Send } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Card } from "@zequel/ui/components/card"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Textarea } from "@zequel/ui/components/textarea"
import { relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, updateCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { AboutStory } from "@zequel/types"

const RESOURCE = "about-story"

export default function AboutStoryPage() {
  const { items, isLoading, error, mutate } = useCmsList<AboutStory>(RESOURCE)
  const story = items[0] ?? null

  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)

  // Sync the textarea when the row loads/changes.
  useEffect(() => {
    if (story) setBody(story.body)
  }, [story])

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  async function save(nextStatus?: "published") {
    setSaving(true)
    try {
      if (story) {
        await updateCmsItem<AboutStory>(RESOURCE, story.id, {
          body,
          ...(nextStatus ? { status: nextStatus } : {}),
        })
      } else {
        await createCmsItem<AboutStory>(RESOURCE, {
          body,
          status: nextStatus ?? "draft",
        })
      }
      await mutate()
      toast.success(nextStatus === "published" ? "About story published" : "About story saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="About Story"
        description="The opening paragraphs on the about page. Separate paragraphs with a blank line."
      />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load the about story: {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Story copy</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {story ? `Updated ${relativeTime(story.updatedAt)}` : "Not created yet"}
              </p>
            </div>
            {story && <CmsStatusPill status={story.status} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="about-body">Paragraphs</Label>
            <Textarea
              id="about-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isLoading}
              className="min-h-[260px] text-sm leading-relaxed"
              placeholder={"First paragraph...\n\nSecond paragraph..."}
            />
            <p className="text-[11px] text-muted-foreground">
              Each block separated by a blank line becomes its own paragraph on the site.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => save()} disabled={saving || body.trim().length < 2}>
              <Save className="size-4" /> Save draft
            </Button>
            <Button onClick={() => save("published")} disabled={saving || body.trim().length < 2}>
              <Send className="size-4" /> Save &amp; publish
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <p className="text-sm font-medium text-foreground">Preview</p>
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-5 text-pretty leading-relaxed text-foreground/90">
            {paragraphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Start typing to see a preview.</p>
            ) : (
              paragraphs.map((p, i) => (
                <p key={i} className="text-sm">
                  {p}
                </p>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
