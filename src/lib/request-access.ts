const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Payload shape is the one bio.link's own widget sends: the `response` object
 * carries the form's fields (name/email/message are the required three) and
 * the top-level `email` is what the submission is filed under.
 */
const ENDPOINT = import.meta.env.VITE_REQUEST_ACCESS_ENDPOINT ?? "";
const MESSAGE = "Requested access to IssueLyst";

export function isRequestAccessConfigured(): boolean {
  return Boolean(ENDPOINT);
}

export async function requestAccess({ email: raw }: { email: string }) {
  const email = raw.trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!ENDPOINT) {
    console.error("[request-access] VITE_REQUEST_ACCESS_ENDPOINT is not set");
    throw new Error("Couldn't send your request. Try again in a moment.");
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        response: {
          name: email.split("@")[0],
          email,
          message: MESSAGE,
        },
      }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  if (res.status === 429) {
    throw new Error("Too many requests right now. Try again in a minute.");
  }
  if (!res.ok) {
    console.error("[request-access]", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't send your request. Try again in a moment.");
  }
  return { ok: true as const };
}
