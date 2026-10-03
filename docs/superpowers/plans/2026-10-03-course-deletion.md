# Course Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a super admin or the responsible profile that created a course to permanently delete it and all course-derived data after explicit confirmation.

**Architecture:** Add a server-authorized DELETE operation to the existing event endpoint and centralize destructive cleanup in a transactional PostgreSQL function. Expose creator metadata to the event admin UI so only eligible users see the action, while the server remains authoritative.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/PostgreSQL, Vitest, Vercel.

---

### Task 1: Transactional database cleanup

**Files:**
- Create: `supabase/migrations/202610030002_safe_course_deletion.sql`

- [x] Add a security-definer PostgreSQL function that removes achievements tied to event-generated grade history, removes that grade history, and deletes the event.
- [x] Keep member profiles and unrelated histories untouched.
- [x] Return whether an event row was deleted so the API can detect stale IDs.

### Task 2: Server-side authorization and audit

**Files:**
- Modify: `app/api/admin/events/[eventId]/route.ts`

- [x] Add `DELETE` using the shared scoped-admin guard.
- [x] Load `created_by`, translations, and event type before deletion.
- [x] Permit only super/global admin or a profile matching `created_by`.
- [x] Invoke the transactional function and write an audit record after success.
- [x] Return useful 403, 404, and database error responses.

### Task 3: Course deletion UI

**Files:**
- Modify: `components/admin/events-admin.tsx`

- [x] Include `created_by` in the event model and event query.
- [x] Replace direct Supabase deletion with the protected API operation and existing authentication bridge headers.
- [x] Show the action only to the super/global scope or matching creator.
- [x] Confirm with the localized course title and an explicit linked-data warning.
- [x] Disable duplicate submissions, refresh the list, and display success/error feedback.

### Task 4: Verification and deployment

**Files:**
- Modify only if required by failing checks.

- [x] Run `npm run typecheck` and `npm run build`.
- [x] Run `git diff --check` and inspect the final diff for unrelated changes.
- [ ] Commit and push to `main`.
- [ ] Verify the matching Vercel deployment reaches `Ready`.
