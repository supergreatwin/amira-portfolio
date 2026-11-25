import { createClient } from "npm:@supabase/supabase-js@2.119.1";

const PROJECT = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const originSet = new Set([
  "https://amiraabdelfadil.com",
  "https://www.amiraabdelfadil.com",
]);
const encoder = new TextEncoder();
const admin = createClient(PROJECT, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function send(origin: string, status: number, payload: Record<string, unknown>) {
  return new Response(status === 204 ? null : JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type, apikey",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
async function digest(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(SERVICE), { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
}
const success = "If this address is eligible, it has been added to Field Notes.";


type WelcomeSubscriber = { id: string; email: string; locale: string; unsubscribe_token: string; subscribed_at: string };

async function sendWelcome(subscriber: WelcomeSubscriber): Promise<void> {
  const apiKey = Deno.env.get("NOTEBOOK_RESEND_API_KEY");
  if (!apiKey) {
    console.warn("Notebook welcome skipped: sending secret is not configured");
    return;
  }
  const ar = subscriber.locale === "ar";
  const unsubscribeUrl = "https://amiraabdelfadil.com/" + (ar ? "ar/" : "") +
    "notes.html?unsubscribe=" + encodeURIComponent(subscriber.unsubscribe_token);
  const payload = JSON.stringify({
    from: "Amira Abdelfadil <noreply@amiraabdelfadil.com>",
    to: [subscriber.email],
    subject: ar ? "أهلًا بك في Notebook" : "Welcome to Notebook",
    template: {
      id: ar ? "30177eb2-01c1-4941-a302-b95d40a3fc5f" : "f501bf64-8902-4560-b6df-ba259581f7d5",
      variables: { NOTEBOOK_UNSUBSCRIBE_URL: unsubscribeUrl },
    },
    tags: [{ name: "category", value: "notebook_welcome" }, { name: "locale", value: ar ? "ar" : "en" }],
  });
  const idempotencyKey = "notebook-welcome/" + subscriber.id + "/" + subscriber.subscribed_at;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: payload,
        signal: AbortSignal.timeout(5000),
      });
      if (result.ok) {
        await result.body?.cancel();
        console.info("Notebook welcome accepted by Resend");
        return;
      }
      await result.body?.cancel();
      console.warn("Notebook welcome provider response", result.status);
      if (result.status < 500 && result.status !== 429) return;
    } catch {
      console.warn("Notebook welcome request failed");
    }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (!originSet.has(origin)) {
    return new Response(JSON.stringify({ ok: false, error: "Origin not allowed" }), {
      status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (req.method === "OPTIONS") return send(origin, 204, {});
  if (req.method !== "POST") return send(origin, 405, { ok: false, error: "Method not allowed" });
  if (!SERVICE || !PROJECT) return send(origin, 503, { ok: false, error: "Subscription service unavailable" });

  try {
    const body = await req.text();
    if (body.length > 2500) return send(origin, 413, { ok: false, error: "Request too large" });
    const input = JSON.parse(body);
    if (input?.action === "unsubscribe") {
      const token = String(input.token ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(token)) return send(origin, 400, { ok: false, error: "Invalid unsubscribe link" });
      const { error } = await admin.from("field_notes_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("unsubscribe_token", token);
      if (error) throw error;
      return send(origin, 200, { ok: true, message: "You have been unsubscribed from Field Notes." });
    }
    if (input?.action !== "subscribe" || input?.website) {
      // Bot honeypot: no record, no disclosure of subscriber details.
      return send(origin, 200, { ok: true, message: success });
    }
    if (input.consent !== true) return send(origin, 400, { ok: false, error: "Consent is required" });
    const email = String(input.email ?? "").trim().toLowerCase();
    const locale = input.locale === "ar" ? "ar" : "en";
    if (email.length > 254 || email.length < 5 || !emailRegex.test(email)) {
      return send(origin, 400, { ok: false, error: "Enter a valid email address" });
    }
    const forwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
    const candidate = (req.headers.get("cf-connecting-ip") || forwarded || "").trim();
    const clientIP = candidate.length > 0 && candidate.length <= 64 && /^[0-9a-fA-F:.]+$/.test(candidate)
      ? candidate.toLowerCase() : "not-provided";
    const [emailHash, ipHash] = await Promise.all([
      digest("field-notes/email/" + email),
      digest("field-notes/ip/" + clientIP),
    ]);
    const { data: allowed, error: limitError } = await admin.rpc("claim_field_notes_signup_slot", {
      p_email_hash: emailHash,
      p_ip_hash: ipHash,
    });
    if (limitError) throw limitError;
    if (!allowed) return send(origin, 200, { ok: true, message: success });
    const { data: inserted, error } = await admin.from("field_notes_subscribers").insert({
      email, locale, status: "subscribed", source: "website",
      consent_version: "field-notes-2026-11",
    }).select("id,email,locale,unsubscribe_token,subscribed_at").single();
    if (error && error.code !== "23505") throw error;
    let subscriber: WelcomeSubscriber | null = inserted;
    if (error?.code === "23505") {
      // Only an actual transition from unsubscribed to subscribed may send another welcome.
      // Existing active rows are unchanged, and concurrent duplicate requests cannot both win.
      const now = new Date().toISOString();
      const { data: renewed, error: renewalError } = await admin.from("field_notes_subscribers")
        .update({ status: "subscribed", locale, consent_at: now, subscribed_at: now,
          unsubscribed_at: null, updated_at: now, consent_version: "field-notes-2026-11" })
        .eq("email", email).eq("status", "unsubscribed")
        .select("id,email,locale,unsubscribe_token,subscribed_at").maybeSingle();
      if (renewalError) throw renewalError;
      subscriber = renewed;
    }
    // Fail softly on delivery errors; recorded consent remains valid and signup does not fail.
    if (subscriber) {
      try { await sendWelcome(subscriber); }
      catch { console.warn("Notebook welcome processing failed"); }
    }
    return send(origin, 200, { ok: true, message: success });
  } catch (error) {
    console.error("Field Notes signup failed", error instanceof Error ? error.name : "unknown");
    return send(origin, 503, { ok: false, error: "Unable to save this subscription. Please try again." });
  }
});
