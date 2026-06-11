import { NextResponse } from "next/server"
import { canCreateServiceClient, createServiceClient } from "@zequel/shared/supabase/service"
import { createSupportTicket } from "@zequel/shared/support/create-ticket"

/**
 * Public contact form submission. Stores the message in cms_contact_messages
 * so it shows up in the admin CMS inbox. Uses the service client because the
 * sender is an anonymous visitor (no auth session).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "Contact form message"
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Please enter a longer message." }, { status: 400 })
    }
    if (name.length > 150 || email.length > 200 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "One of the fields is too long." }, { status: 400 })
    }

    if (!canCreateServiceClient()) {
      console.log("[v0] contact submit: service client not configured")
      return NextResponse.json({ error: "Messaging is temporarily unavailable." }, { status: 503 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from("cms_contact_messages").insert({
      name,
      email,
      subject,
      message,
      status: "new",
    })

    if (error) {
      console.log("[v0] contact insert error:", error.message)
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
    }

    // Also create a unified support ticket so the message appears in the admin
    // Support Center. Best-effort: a failure here must not fail the submission.
    try {
      await createSupportTicket({
        source: "contact_form",
        userEmail: email,
        userName: name,
        subject,
        body: message,
      })
    } catch (ticketError) {
      console.log("[v0] contact -> support ticket failed:", (ticketError as Error).message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log("[v0] contact route error:", (error as Error).message)
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
}
