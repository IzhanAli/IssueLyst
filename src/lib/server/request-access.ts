import { createServerFn } from "@tanstack/react-start";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Landing-page "Request access" form. Emails the address in
 * ACCESS_REQUEST_EMAIL through Resend's REST API. Both env vars are
 * server-only — never give them a VITE_ prefix.
 */
export const requestAccess = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const raw = typeof input === "object" && input !== null ? (input as { email?: unknown }).email : undefined;
    const email = typeof raw === "string" ? raw.trim() : "";
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    return { email };
  })
  .handler(async ({ data }) => {
    const to = process.env.ACCESS_REQUEST_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!to || !apiKey) {
      console.error("[request-access] ACCESS_REQUEST_EMAIL or RESEND_API_KEY is not set");
      throw new Error("Access requests aren't available right now.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ACCESS_REQUEST_FROM || "IssueLyst <onboarding@resend.dev>",
        to: [to],
        reply_to: data.email,
        subject: `IssueLyst access request — ${data.email}`,
        text: `${data.email} requested access to IssueLyst.\n\nReply to this email to respond to them directly.`,
      }),
    });

    if (!res.ok) {
      console.error("[request-access] Resend responded", res.status, await res.text());
      throw new Error("Couldn't send your request. Try again in a moment.");
    }
    return { ok: true as const };
  });
