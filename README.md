# Opygen Dashboard

Opygen Dashboard is a premium co-founder workspace and internal project management system built with Next.js, TypeScript, and MongoDB. It allows co-founders to track ongoing software developments, manage payment milestones, analyze co-founder workloads, and manage onboarding for new members.

---

## Key Features

- **Co-founder Admin Dashboard**: A premium analytics hub displaying live project metrics, financial & billing statistics (pipeline budgets, cash collected, outstanding payments), project delivery distributions, and co-founder workloads with interactive Recharts.
- **Project Tracking Drawer**: Slide-out details drawer containing task descriptions, progress indicators, interactive comment/activity logs, and payment milestone managers.
- **Payment Milestone Tracker**: Fully-featured milestones engine including interactive financial stats decks (Received, Pending, Total, Unallocated Budget), shadcn confirmation dialogs, receipt uploads (integrated with Cloudinary), and budget limits enforcement.
- **Redirection System & Middleware**: Integrates a robust `src/middleware.ts` proxy linked to next-auth. Matched pages automatically enforce active session token verification, role permissions (admin-only routes), and force-redirect users to password updates if marked for mandatory password change.
- **Onboarding Flow**: Automatic welcome email dispatch to newly created users with their email, temporary key credentials, and activation login links, formatted in clean responsive EJS email templates.
- **Password Activation Flow**: Users created by administrators start in a `Pending` state and are forced to configure a new personal password upon first login, which immediately activates their profile to `Active` in real-time.
- **Strict Budget Validations**: Integrated front-end and back-end Zod refinement rules to prevent invalid project budgets: active status projects require budgets $> 0$, and pipeline projects (`potential` / `future`) enforce min/max budget values.

---

## Environment Variables Configuration

To run the application, configure a `.env` file in the root directory:

```env
# Database Connection URI (specifies target database)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/opygen-dashboard?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_jwt_signing_secret
NEXTAUTH_URL=http://localhost:3000

# Default password for first-time seeded admin accounts
DEFAULT_PASSWORD=your_secure_default_passkey

# SMTP Configuration (For reset password and user welcome onboarding emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=opygen.info@gmail.com
SMTP_PASS=your_app_specific_smtp_password
SMTP_FROM="OpyDash" <noreply@opygen.com>

# Cloudinary Configuration (For payment receipt uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## Getting Started

### Installation

```bash
pnpm install
```

### Seeding the Database
To seed the database manually with the initial co-founder admin user:

```bash
pnpm seed
```

### Run the Development Server
Starting the development server automatically runs the seeding check before booting Next.js:

```bash
pnpm dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Code Quality & Type Safety

Verify TypeScript type checks and linting before submitting code:

```bash
# Typecheck verification
pnpm tsc --noEmit

# Code lint check
pnpm lint
```
