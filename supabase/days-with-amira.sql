-- Extend the existing content registry. No grants, roles, RLS or storage policies change.
alter table public.cms_sections drop constraint cms_sections_key_check;
alter table public.cms_sections add constraint cms_sections_key_check check (
  key in ('homepage_hero','homepage_intro','about_intro','writing_intro','art_intro','contact_intro','homepage_feature','days_with_amira','days_with_amira_draft')
  or key ~ '^days_with_amira_asset_[a-f0-9-]{36}_(480|960|1600)$'
);
