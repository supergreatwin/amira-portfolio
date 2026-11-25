# Days with Amira visual diary

The owner confirmed the 32-file Days with Amira Drive folder as the complete source set on 25 November 2026. The site uses 29 selected photographs after removing an exact duplicate, a duplicate mirror photograph and a near-identical portrait. See provenance.json for source hashes and exact screenshot crop rectangles. Uncropped source files and their metadata are not published here.

Images retain their photographic frame after the five privacy/interface crops. No colour grading, retouching, AI substitution or CSS effects are applied. WebP variants and JPEG fallbacks keep the original aspect ratio, have no embedded EXIF/XMP/IPTC/ICC metadata, are never upscaled and have a maximum long edge of 1600 pixels.

The bilingual document is diary.json. days-with-amira-build.mjs generates complete English and Arabic HTML during the normal Pages build, so visitors can read the diary with JavaScript disabled or the CMS unavailable.

In Editorial Desk, sign in normally and open “Days with Amira · Manage the visual diary”. Edit the opening words, add/reorder chapters, edit bilingual reflections and image descriptions, move photographs between chapters, choose the opening image, or upload a cropped original. Save private draft does not change the public page. Publish diary saves both locales together. Reload saved diary discards unsaved edits after confirmation.

The existing cms_sections registry stores the published document, private draft and image-reference records. The SQL extension only permits these new content keys. Existing editor/admin authorization, RLS, grants, storage bucket and storage policies are unchanged. Newly uploaded photographs use sections/days-with-amira/ paths and are signed for visitors only when the corresponding reference records are enabled by publication. New uploads are re-encoded in the browser and metadata chunks are removed without changing the encoded pixels. Removed upload references are disabled in the same publication request. Existing signed URLs may remain usable until their one-hour expiry.

Rollback: revert the release commit to restore the previous public site. If a diary override has subsequently been published, an authorized editor must also disable the days_with_amira row. Retain the added key constraint while diary records exist; remove diary rows before restoring the former constraint. No permission rollback is needed.
