# Amira Abdelfadil — legal and security operations checklist

Last reviewed: 22 November 2026. Owner approval and jurisdiction-specific legal review remain necessary. This document is operational guidance, not a certification or legal opinion.

## Implemented in the repository

- English and Arabic `privacy.html`, `terms.html`, and `cookies.html` policy pages.
- Shared footer legal links and privacy-settings control across Cloudflare-built HTML, including English, Arabic, mobile, editor and educational pages.
- Sitewide consent-first optional GA4: no Google Analytics tag loads before opt-in; prior consent can be withdrawn and a loaded tag is stopped by reloading after withdrawal.
- Essential and optional storage categories disclosed. Privacy choices persist for up to 180 days. Browser preference changes remain available.
- Tally iframe widgets on collaboration and pitch pages only load after a visitor chooses to open them; direct Tally links remain as a fallback.
- Basic Cloudflare Pages headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and CSP `frame-ancestors`. These are build configuration changes and require a live response-header check.
- Regression test in `tests/legal-privacy.test.mjs`; GitHub Action runs it on every push to main.

## Verified existing backend baseline (22 November 2026)

- The Amira Supabase project has RLS enabled for all 24 public tables, but individual policies still require adversarial user/role testing.
- The educational launch flag was false.
- `amira-education-private` and `amira-site-content` storage buckets were private, and `homepage-photos` was public.
- Server-side Edge Functions were active for password-reset quotas and Field Notes signup.
- Supabase Security Advisor reported leaked-password protection disabled; the connected organization is on the Free plan, and Supabase currently restricts this protection to Pro and above. Do not describe it as enabled.

## Before treating the site as legally approved

- [ ] Confirm the legal identity and correspondence address of the controller with Amira; the published policies currently identify Amira Abdel-Fadil, Cairo, and byamira01@gmail.com.
- [ ] Have qualified Egyptian counsel review applicability of Personal Data Protection Law No. 151/2020 and Regulations No. 816/2025, including any media exceptions, notifications, licensing, DPO obligations, and cross-border transfers.
- [ ] Confirm actual vendors and contracts: Cloudflare, GitHub, Supabase, Tally, Google Analytics, and any email provider(s) used for delivery. Keep the policies current as integrations change.
- [ ] Map all personal-data fields and lawful bases, including Field Notes consent records, Tally submissions, editorial accounts, educational member data, and logs.
- [ ] Set documented retention periods and data-deletion, correction, access-request, unsubscribe, and complaint procedures. Test removal from processors and backups where applicable.
- [ ] Confirm copyright and model/location/talent permissions for documentary stills, photographs, trailers, contributors, and any educational materials.
- [ ] Assess whether minors can enroll; if yes, obtain required guardian safeguards before accepting them.
- [ ] Review paid education-specific terms and refund/cancellation obligations before offering paid enrollment.

## Manual production verification

- [ ] Confirm `/privacy.html`, `/terms.html`, `/cookies.html`, and their `/ar/` equivalents render and are linked from every footer.
- [ ] In a clean browser profile, load the homepage and confirm optional Google Analytics makes **no network request** before consent.
- [ ] Reject optional cookies and confirm no Google Analytics request on subsequent pages.
- [ ] Accept optional analytics and confirm GA4 initializes only on the canonical production hostname.
- [ ] Open Privacy settings and revoke; confirm Google Analytics ceases after page reload, and visible analytics cookies are cleared where possible.
- [ ] Open a collaboration or pitch page and confirm `tally.so` does not load until the visitor explicitly clicks to open the form. Verify the Arabic forms and direct fallback links.
- [ ] Check the consent dialog and legal notices at mobile widths, in RTL layout, dark mode, and with keyboard and screen reader.
- [ ] Inspect the live response headers. Test HSTS separately before enabling it (avoid breaking subdomains).
- [ ] Confirm Cloudflare Pages latest deployment and the GitHub legal privacy CI test passed.

## Security work still requiring privileged platform configuration or testing

- [ ] Enable MFA for all editors/administrators and on Cloudflare, GitHub, and Supabase owner accounts.
- [ ] Configure stronger Supabase Auth password requirements in dashboard. Leaked-password detection is unavailable on the current Free plan.
- [ ] Perform real authorization tests for anonymous, unauthorized logged-in, editor, admin, unapproved learner, and approved learner sessions. RLS-on alone is insufficient.
- [ ] Verify password-reset email throttling and abuse resistance from independent clients, not only the website UI. Review Supabase native Auth quotas.
- [ ] Inspect Cloudflare WAF/rate limiting, DNSSEC, email authentication (SPF, DKIM, DMARC), access logs, and domain redirects.
- [ ] Test backup and restore, dependency and secret scanning, incident-response contacts and notifications, and owner access recovery.
- [ ] Review external scripts and embeds after any marketing, analytics, newsletter, or video integration change.

## Operational guardrails

Do not publish user-submitted film material without separately agreed rights. Do not treat a hidden URL, frontend role check, or unpublished toggle as adequate data access control. Do not publish service-role keys or private personal data in the public repository. Recheck consent behavior whenever Google Analytics or Tally code changes.
