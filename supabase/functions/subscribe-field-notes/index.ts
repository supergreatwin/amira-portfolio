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
    const { error } = await admin.from("field_notes_subscribers").insert({
      email, locale, status: "subscribed", source: "website",
      consent_version: "field-notes-2026-11",
    });
    if (error && error.code !== "23505") throw error;
    if (error?.code === "23505") {
      // A fresh explicit consent can reactivate an unsubscribed address.
      // Keep existing subscriptions idempotent and preserve the unsubscribe token.
      const now = new Date().toISOString();
      const { error: renewalError } = await admin.from("field_notes_subscribers")
        .update({ status: "subscribed", locale, consent_at: now, subscribed_at: now,
          unsubscribed_at: null, updated_at: now, consent_version: "field-notes-2026-11" })
        .eq("email", email).eq("status", "unsubscribed");
      if (renewalError) throw renewalError;
    }
    return send(origin, 200, { ok: true, message: success });
  } catch (error) {
    console.error("Field Notes signup failed", error instanceof Error ? error.name : "unknown");
    return send(origin, 503, { ok: false, error: "Unable to save this subscription. Please try again." });
  }
});
