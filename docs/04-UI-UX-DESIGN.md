# TASQ-ONE — UI/UX Design Document (Google Stitch Workflow)

**Design tool:** Google Stitch (AI UI generator) → export → implement in Antigravity IDE with Tailwind CSS

---

## 1. Design Principles
- **Clarity over density** — Admin sees more data, Employee sees less but sharper focus.
- **Two distinct visual "modes"** within one design system: Admin (data-dense, KPI-forward) vs Employee (task-forward, minimal).
- **Consistent design tokens** across both panels (same color system, spacing scale, typography) so it never feels like two apps.
- Mobile-first responsive; PWA installable.

## 2. Design Tokens (to define first in Stitch)

| Token | Value (suggested) |
|---|---|
| Primary color | Indigo/Blue (#4F46E5 range) — trust, productivity |
| Accent (Urgent) | Red/Orange (#F97316 / #EF4444) |
| Success (Completed) | Green (#22C55E) |
| Neutral background | #F9FAFB (light), #0F172A (dark mode) |
| Font | Inter / Geist (clean, SaaS-standard) |
| Radius | 8–12px (soft, modern cards) |
| Spacing scale | 4/8/12/16/24/32px |

## 3. Screen Inventory

### Auth & Onboarding
1. Landing/Marketing page
2. Sign up (create org)
3. Login
4. Onboarding wizard (org name, invite teammates, create first task)

### Admin Panel
5. Admin Dashboard (KPI cards + productivity chart)
6. Task List view (table, filterable)
7. Kanban Board view
8. Task Detail / Edit modal
9. Team Management (members, roles)
10. Activity Log / Audit Trail
11. Org Settings
12. Notification Center

### Employee Panel
13. Employee Dashboard (Today / Upcoming / Completed)
14. My Tasks (list + Kanban toggle)
15. Task Detail (employee view — status update, comment, attach)
16. Notification Center (shared component, scoped)
17. Profile/Settings

### Shared
18. Empty states (no tasks, no notifications)
19. Error / 404 / offline (PWA) states
20. Mobile nav (bottom tab bar for Employee; sidebar collapses to drawer for Admin)

## 4. Key User Flows

**Flow A — Admin creates & assigns a task**
Dashboard → "+ New Task" → Fill form (or "Enhance with AI") → AI suggests assignee based on workload → Confirm → Task appears on assignee's board in real time.

**Flow B — Employee completes a task**
Notification/Dashboard → Open task → Update status to "In Progress" → Add comment/attachment → Move to "In Review" → Admin notified → Admin marks "Completed".

**Flow C — Onboarding**
Signup → Create org → Invite 2–3 teammates (email) → Guided creation of first task → Land on Dashboard.

## 5. Kanban Board Spec
- Columns: Pending / In Progress / In Review / Completed
- Card shows: title, assignee avatar(s), priority color tag, due date, comment count icon
- Drag-and-drop → optimistic UI update → Supabase Realtime confirms/syncs across clients
- Filter bar above board: Assignee, Priority, Tag, Due date range

## 6. Component Library (build once, reuse everywhere)
- Button (primary/secondary/danger/ghost)
- Card (task card, KPI card)
- Modal/Drawer (task detail, invite user)
- Table (sortable, filterable — used in Admin task list, activity log)
- Badge (status, priority)
- Avatar / Avatar group
- Toast/notification banner
- Empty state illustration block
- Chart components (bar/line for productivity — using a lightweight chart lib)

## 7. Google Stitch Workflow (how to actually use it here)
1. In Stitch, describe each screen from the inventory above one at a time (not the whole app at once) — Stitch performs best on focused, single-screen prompts.
2. Feed Stitch the design tokens (Section 2) at the start of the session so every screen stays visually consistent.
3. Export each generated screen's layout/structure as reference, then re-implement using Tailwind + the shared component library in Antigravity IDE (don't blindly paste Stitch's raw code — reconcile it against the component library so nothing gets duplicated).
4. Iterate Admin screens and Employee screens as two separate Stitch threads/sessions, referencing the same token set, so the two "modes" stay visually unified.

## 8. Accessibility & Responsiveness
- Minimum tap target 44x44px (mobile)
- Color is never the only status indicator (icon + text + color)
- Kanban board must be operable via keyboard (tab + enter to move cards) — Phase 1 basic support, full drag-free reorder Phase 2
- Dark mode supported via Tailwind `dark:` variants from day one (cheap to add now, expensive to retrofit)
