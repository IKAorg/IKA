# Database Schema V1

## Scope

This schema defines the foundation for the MVP:

- authentication profile mapping
- roles and scoped role assignment
- languages
- CMS pages and content blocks
- news and events
- countries and dojos
- members and IKA numbers
- grade history
- correction requests
- privacy consent
- media library
- legacy content migration
- audit logs
- system settings

Courses, taikais, certificates, and advanced statistics are expected in later migrations.

## Core Tables

### users_profiles

Links `auth.users` to application profile data.

Important fields:

- `id`
- `auth_user_id`
- `email`
- `display_name`
- `status`

### roles

Defines system roles:

- `super_admin`
- `global_admin`
- `country_admin`
- `dojo_admin`
- `kenshi`

### permissions

Atomic permission names used by admin screens and server checks.

### role_permissions

Maps roles to permissions.

### user_roles

Assigns a role to a user with optional country or dojo scope.

Only one of `country_id` or `dojo_id` should be set for scoped roles.

## Multilingual Model

The platform uses base tables plus translation tables.

Examples:

- `pages` + `page_translations`
- `countries` + `country_translations`
- `dojos` + `dojo_translations`
- `news` + `news_translations`
- `events` + `event_translations`

Translation rows include:

- `language_code`
- `title` or `name`
- `slug`
- optional content fields
- SEO metadata

## Public CMS

### pages

Stores page identity, type, status, and publication state.

### page_translations

Stores localized title, slug, body summary, SEO title, and SEO description.

### content_blocks

Stores block-based page content. Blocks are ordered and use JSONB for flexible block payloads.

Block rendering must validate the block type and data shape before display.

## Countries And Dojos

### countries

Stores non-translated country data: code, flag, image, responsible email, status, visibility.

### country_translations

Stores localized country name, slug, and description.

### dojos

Stores country relationship, city, instructor, contact fields, status, visibility, and joined date.

### dojo_translations

Stores localized dojo name, slug, and description.

## Members

### members

Stores the official Kenshi registry.

Important rules:

- `ika_number` is unique and permanent.
- `ika_sequence` is unique and never reused.
- country and dojo are separate from IKA number.
- current grade can be derived from grade history, but cached for convenient reading.
- official fields are not directly editable by Kenshi users.

### grade_history

Stores all grade events. Current grade should be updated by application logic or a controlled database function after grade changes.

## Privacy

### privacy_consents

Stores consent acceptance records, policy versions, guardian consent for minors, and timestamps.

### correction_requests

Allows members to request changes without directly editing official data.

## Audit

### audit_logs

Stores important actions with old and new JSONB values.

For sensitive fields, application code should avoid logging unnecessary personal data.

## Index Strategy

Initial indexes focus on:

- foreign keys
- public slug lookups
- admin filters by country, dojo, status
- IKA number lookup
- translation language lookup

Future indexes should be added based on query plans, not guesses.

