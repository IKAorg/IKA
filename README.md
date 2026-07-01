# IKA Platform

Digital platform for the International Kempo Association.

The project starts with architecture, database design, permissions, and multilingual foundations before application screens.

## Current Foundation

- Architecture overview: `docs/architecture/overview.md`
- Database schema notes: `docs/database/schema-v1.md`
- RLS strategy: `docs/permissions/rls-strategy.md`
- MVP roadmap: `docs/roadmap/mvp.md`
- Initial Supabase migration: `database/migrations/001_initial_schema.sql`

## First MVP Scope

- Public multilingual website
- Admin login
- CMS page editor
- Countries
- Dojos
- Members
- IKA number
- Basic Kenshi profile
- Basic IKA Passport

## Recommended Next Step

Review the initial schema and RLS strategy, then scaffold the Next.js/Supabase application foundation.

## Development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Local development runs at:

```txt
http://localhost:3000/en
```
