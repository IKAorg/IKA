# IKA Platform Architecture Overview

## Goal

IKA Platform is a modular international platform for the International Kempo Association. It is not a static website. The first release must establish a stable foundation for multilingual public content, CMS administration, countries, dojos, members, IKA numbers, and a basic Kenshi portal.

## Recommended Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage
- Vercel
- GitHub

## Architecture Principles

1. Keep one repository, one Supabase project, and one Vercel project for IKA.
2. Treat the database and permission model as product architecture, not implementation detail.
3. Use translation tables for multilingual content. Do not add language-specific columns.
4. Use Row Level Security from the first migration.
5. Keep official member data separate from self-service correction requests.
6. Use audit logs for important mutations.
7. Add modules through explicit bounded areas rather than a single large admin surface.

## Application Areas

### Public Website

Serves multilingual published content under locale-prefixed routes:

- `/en`
- `/es`
- `/it`
- `/fr`
- `/ja`
- `/zh`
- `/cs`

The public site reads only published content, visible countries, visible dojos, news, and events.

### Global Admin

Used by Super Admin IKA and Global Admin users. It manages global CMS content, languages, media, countries, dojos, members, and system settings according to role permissions.

### Country Admin

Scoped administration for one or more countries. Country Admins can manage their country content, dojos, members, courses, taikais, and country statistics.

### Dojo Admin

Scoped administration for one or more dojos. Dojo Admins can manage dojo content, basic member updates for their dojo, and dojo statistics.

### Kenshi Portal

Private member portal. Kenshi can see their own profile, grade history, course history, taikai history, certificates, and basic IKA Passport. Official data is not directly editable by the member; changes go through correction requests.

## Recommended Project Structure

```txt
app/
  [locale]/
    (public)/
    admin/
    portal/
components/
  admin/
  cms/
  forms/
  layout/
  public/
database/
  migrations/
  policies/
  seed/
docs/
  architecture/
  database/
  permissions/
  roadmap/
lib/
  auth/
  cms/
  i18n/
  permissions/
  supabase/
scripts/
types/
```

## Key Architectural Decisions

### Role Scope

Do not store a single role directly on a user profile. A user can have more than one role and each role can have an optional scope:

- global scope
- country scope
- dojo scope

This supports real-world administration without future rewrites.

### Multilingual Content

Base records store identity, status, ownership, and timestamps. Translation tables store language-specific fields such as title, slug, body, SEO title, and SEO description.

This avoids schema changes when adding languages.

### Member Identity

IKA number is global and permanent. It must not include country or dojo because a member can move while keeping the same identity.

Recommended format:

```txt
IKA-000001
```

Numbers must never be reused.

### Privacy

The MVP must avoid sensitive personal data:

- no DNI or government passport numbers
- no full home address
- no medical data
- no photos of minors

Member deletion should default to deactivation/anonymization, not hard deletion.

## Tradeoffs

### Supabase RLS

Advantages:

- strong database-level protection
- good fit for scoped country/dojo permissions
- reduces risk from accidental frontend exposure

Disadvantages:

- policies require discipline and testing
- complex roles need helper functions

### Block-Based CMS

Advantages:

- flexible pages without developer intervention
- supports reusable sections
- good for international content operations

Disadvantages:

- requires validation and safe rendering
- custom HTML must be tightly restricted or deferred

### Single Supabase Project

Advantages:

- simpler operations
- one source of truth
- easier reporting

Disadvantages:

- permission boundaries must be designed carefully
- staging strategy must be planned before production use
