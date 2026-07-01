# Public Website CMS Plan

## Current State

The public website now uses locale-aware content modules in code so the public pages can be reviewed quickly in all supported languages.

This is an interim foundation, not the final editorial model.

## Target State

The same public content must be editable from the admin CMS, similar to the SKBC admin workflow:

- global navigation labels
- homepage hero
- homepage sections
- page titles
- page introductions
- content blocks
- CTA buttons
- images
- SEO title
- SEO description
- publication status
- language visibility

## Database Mapping

Use the existing schema foundation:

- `pages`
- `page_translations`
- `content_blocks`
- `media_library`
- `countries`
- `country_translations`
- `dojos`
- `dojo_translations`
- `news`
- `news_translations`
- `events`
- `event_translations`

## Admin Workflow

1. Super Admin or Global Admin creates/edit public pages.
2. Each page has translations per language.
3. Blocks are ordered and validated by block type.
4. Draft content is previewable in admin.
5. Published content appears on the public website.
6. Country Admins and Dojo Admins can edit only scoped public content.

## Migration Path

1. Keep current translated static content as seed/reference content.
2. Build Admin login.
3. Build CMS page editor using `pages`, `page_translations`, and `content_blocks`.
4. Seed current public content into Supabase.
5. Change public pages to read from Supabase with fallback to English.
6. Add preview/draft workflow.

## Important Rule

The public website must remain a normal institutional website. Private role-based access must stay behind a single login entry and must not dominate the public homepage.
