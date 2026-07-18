# Architecture & Technical Design

This document details the architectural decisions, data models, state flows, and caching systems implemented in the Opygen Dashboard.

---

## 1. Technical Stack Overview
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose ODM)
- **State Management**: Redux Toolkit (for frontend client state)
- **Data Fetching & Mutations**: React Query (TanStack Query) (for server state synchronizations)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS & CSS Modules

---

## 2. Directory Layout
```
e:\Opygen\Opygen-Dashboard
├── scripts/               # Server scripts (Database seeds, checking utils)
├── src/
│   ├── app/               # Next.js App Router pages and API handlers
│   │   ├── (auth)/        # Auth pages (Login, change password, reset password)
│   │   ├── (dashboard)/   # Main dashboard layouts (Admin & User dashboards)
│   │   └── api/           # Backend REST API endpoint handlers
│   ├── components/        # UI Views, Forms, Drawers, and Shared Components
│   ├── emails/            # EJS Templates for SMTP notifications
│   ├── lib/               # Helpers (DB connection, emailer, schemas validations)
│   ├── models/            # Mongoose ODM Database schemas
│   ├── store/             # Redux slice state stores
│   ├── types/             # Common TypeScript type definitions
│   ├── middleware.ts      # Next.js Middleware delegator
│   └── proxy.ts           # Route auth rules, redirect engines, and roles checker
```

---

## 3. Database Schemas & Data Model

### User Schema (`src/models/User.ts`)
- **Key Fields**:
  - `role`: `'admin' | 'member'` (determines view layouts and route clearance)
  - `status`: `'pending' | 'active' | 'blocked'` (onboarded users start as `pending`, activate on password update, and cannot log in if `blocked`)
  - `needPasswordChange`: `boolean` (when true, redirects users to configure password before accessing the system)
  - `passwordHash`: bcrypt hashed credentials

### Project Schema (`src/models/Project.ts`)
- **Key Fields**:
  - `budget`: `number` (active projects) or range values (pipeline projects)
  - `payments`: Subdocument array containing payment milestones:
    - `type`: `'advance' | 'frontend' | 'backend' | 'ui' | 'custom' | 'other'`
    - `customLabel`: optional custom string for type `'custom'`
    - `amount`: number
    - `status`: `'pending' | 'paid'`
    - `receiptUrl`: optional string linking to Cloudinary receipt attachments

---

## 4. Middleware & Navigation Proxy (`src/proxy.ts` / `src/middleware.ts`)
The next-auth authentication rules are routed via a two-layer delegator:
1. **Next.js Entrypoint (`src/middleware.ts`)**: Invoked by Next.js on matching paths to process requests.
2. **Proxy Core (`src/proxy.ts`)**: Evaluates token state and triggers redirects:
   - **Password Change Enforcement**: If `token.needPasswordChange` is true and path is not `/change-password`, redirects user to `/change-password` and blocks API routes with `403`.
   - **Admin Access Restriction**: Routes matching `/admin-dashboard` or `/api/users/add` block non-admin users and redirect them to their respective workspaces.
   - **Active Redirects**: Logged-in admin users accessing `/dashboard` are redirected to `/admin-dashboard`, while member users are directed to `/dashboard`.

---

## 5. State Management & Real-time Refresh

### Redux Core (`src/store/projectsSlice.ts`)
- Manages the client state for the main projects list view (sorting, search queries, category filters, and active pagination).
- **Automatic Refetching**: Dispatched by project drawer actions (upon editing, adding milestones, or deleting) to trigger `fetchProjectsThunk`. This automatically synchronizes backend database changes with the visible Redux dashboard list in real-time.

### React Query (`@tanstack/react-query`)
- Synchronizes server state for specific data instances (e.g. details of a single project, comments logs, or dashboard statistics).
- Invalidation queries are executed in parallel upon successful mutations to keep dashboard statistics decks and progress bars fresh.

---

## 6. Caching & Caching Bypass
Next.js App Router aggressively caches fetch results. To ensure live updates, caching is bypassed:
- **Fetch Settings**: Client-side requests specify `{ cache: 'no-store' }`.
- **Server API Handlers**: GET route handlers export:
  ```typescript
  export const dynamic = 'force-dynamic';
  export const revalidate = 0;
  ```
  And return headers enforcing dynamic parsing:
  ```typescript
  'Cache-Control': 'no-store, max-age=0, must-revalidate'
  ```
