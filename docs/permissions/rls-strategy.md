# RLS And Permission Strategy

## Goals

1. Public users can read only published public content.
2. Super Admin IKA can manage everything.
3. Global Admin can manage global content but not critical system settings unless granted.
4. Country Admin can manage records scoped to assigned countries.
5. Dojo Admin can manage records scoped to assigned dojos.
6. Kenshi can read their own private profile and submit correction requests.

## Role Model

Users receive roles through `user_roles`.

Each role assignment can be:

- global: no `country_id`, no `dojo_id`
- country scoped: `country_id` set
- dojo scoped: `dojo_id` set

This allows one person to hold multiple responsibilities.

## Helper Functions

RLS policies should use stable helper functions:

- `app.current_profile_id()`
- `app.has_role(role_key text)`
- `app.is_super_admin()`
- `app.can_manage_country(country_id uuid)`
- `app.can_manage_dojo(dojo_id uuid)`
- `app.current_member_id()`

Wrapping `auth.uid()` in helper functions keeps policies readable and reduces duplicated logic.

## Public Read Policy

Public read access is limited to:

- active languages
- published pages
- published page translations
- visible content blocks for published pages
- visible countries
- visible dojos
- published news
- published events

Public access must never expose:

- member registry
- admin profiles
- private emails where not intended
- audit logs
- system settings

## Admin Write Policy

Admin writes should be checked by both:

- route/server action permission checks
- database RLS

RLS is the final safety boundary.

## Member Privacy

Kenshi users can read only their own member profile. They cannot update official member fields directly.

Allowed self-service actions:

- read own member profile
- read own grade history
- create correction request
- read own correction requests
- read own consent history

## Audit Logging

Every important admin mutation should create an audit log:

- profile role changes
- country changes
- dojo changes
- member changes
- grade history changes
- CMS publish/unpublish actions
- system setting changes

The audit log is readable only by Super Admin IKA and selected Global Admin permissions.

## Known RLS Risk

Complex RLS can become hard to reason about. The mitigation is to keep policies small, use helper functions, and add automated policy tests before production.

