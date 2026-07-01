# MVP Roadmap

## Phase 0: Foundation

Deliverables:

- architecture overview
- database schema
- RLS strategy
- initial migration
- Next.js project scaffold
- Supabase client setup
- environment variable template

Exit criteria:

- schema applies cleanly to a fresh Supabase database
- roles and language seed data exist
- public read policies and private member boundaries are testable

## Phase 1: Public Website

Deliverables:

- locale-prefixed routing
- homepage
- basic public pages
- countries listing
- dojos listing
- news listing
- events listing
- language switcher

Exit criteria:

- public visitors can browse published content in supported languages
- fallback language behavior is defined

## Phase 2: Admin Login And CMS

Deliverables:

- admin login
- page list
- page editor
- translation editor
- content block editor
- media library basics

Exit criteria:

- Super Admin can create, translate, publish, and unpublish pages
- public website renders CMS content

## Phase 3: Countries And Dojos

Deliverables:

- country CRUD
- dojo CRUD
- country and dojo translations
- generated public country pages
- generated public dojo pages
- scoped Country Admin and Dojo Admin permissions

Exit criteria:

- Country Admin can manage only assigned country data
- Dojo Admin can manage only assigned dojo data

## Phase 4: Kenshi Registry

Deliverables:

- member CRUD
- IKA number generator
- member search and filters
- grade history
- basic privacy consent tracking

Exit criteria:

- IKA numbers are unique, sequential, and never reused
- member data is protected by RLS

## Phase 5: Kenshi Portal And Passport

Deliverables:

- Kenshi login
- private profile
- grade history view
- correction requests
- basic IKA Passport page
- PDF export strategy

Exit criteria:

- Kenshi can view only their own data
- Kenshi can request corrections without editing official fields

## Deferred Modules

These should be added after the MVP foundation is stable:

- courses
- taikais
- certificates
- advanced statistics
- payments
- licences
- e-learning
- video library
- instructor certification
- online exams
- event registration
- attendance control
- newsletter
- internal messaging

