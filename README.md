# MediCare Connect Client

A hospital appointment and healthcare management platform built with Next.js. MediCare Connect lets patients discover and book appointments with verified doctors, pay consultation fees online, manage prescriptions and reviews, and lets doctors and administrators run their side of the platform through dedicated role-based dashboards.

## Features

- Email/password and Google OAuth authentication via Better Auth
- JWT-based session handling with protected dashboard routes
- Role-based access for Patient, Doctor, and Admin accounts
- Doctor discovery with search, specialization filter, and sort
- Doctor profile pages with server-rendered SEO metadata (dynamic title, description, Open Graph image)
- Appointment booking with date/time selection and Stripe Checkout payment
- Stripe payment success and cancellation flows
- Doctor verification workflow (pending / verified / rejected) managed by admins
- Prescription creation and management by doctors, viewable by patients
- Doctor availability/schedule management
- Patient reviews with star ratings for completed appointments
- Admin analytics dashboard with bar, line, and pie charts
- Admin management of users, doctors, appointments, and payments with search, filtering, and pagination
- Responsive layout across all pages
- Custom 404 page
- Toast notifications for action feedback
- Dynamic per-page document titles

## Tech Stack

| Category          | Technology                                              |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack)                      |
| UI Library        | React 19                                                |
| Styling           | Tailwind CSS v4                                         |
| Component Library | shadcn/ui (Radix UI primitives)                         |
| Authentication    | Better Auth (email/password + Google OAuth, JWT plugin) |
| Database Adapter  | MongoDB (via Better Auth's MongoDB adapter)             |
| Forms             | React Hook Form                                         |
| Animation         | Framer Motion                                           |
| Charts            | Recharts                                                |
| Icons             | Lucide React, React Icons                               |
| Notifications     | react-hot-toast                                         |
| Date Handling     | date-fns, react-datepicker                              |
| Payments          | Stripe (Checkout, integrated via backend API)           |
| Utilities         | clsx, tailwind-merge, cmdk                              |

## Project Structure

```
medicare-connect-client/
├── components.json              # shadcn/ui configuration
├── eslint.config.mjs            # ESLint configuration
├── jsconfig.json                # Path alias configuration (@/*)
├── next.config.mjs              # Next.js configuration (remote image patterns)
├── postcss.config.mjs           # PostCSS configuration (Tailwind CSS v4)
├── public/
│  ├── icons/                    # Static icons (Google logo)
│  └── images/                   # Static illustrations and avatar images
└── src/
   ├── app/                        # Next.js App Router routes
   │  ├── (auth)/                  # Login and register pages
   │  ├── (payment)/                # Stripe success/cancelled pages
   │  ├── (public)/                  # Public marketing and doctor pages
   │  ├── api/auth/[...all]/        # Better Auth route handler
   │  ├── dashboard/                  # Role-based dashboard routes and layout
   │  │  ├── DashboardContext.js        # Dashboard-scoped user/doctor profile context
   │  │  ├── useRoleGuard.js              # Role-based route access hook
   │  │  └── layout.js                      # Sidebar layout shared by all dashboard routes
   │  ├── layout.js                  # Root layout (Navbar, Footer, Providers, Toaster)
   │  ├── not-found.js               # Custom 404 route
   │  ├── Providers.jsx              # Client-side provider composition
   │  └── globals.css                # Tailwind and theme CSS variables
   ├── features/                   # Page-level feature components, grouped by domain
   │  ├── admin/                      # Admin dashboard, users, doctors, appointments, payments
   │  ├── auth/                        # Login and register page components
   │  ├── about/, contact/, not-found/   # Static page components
   │  ├── doctor/                          # Doctor dashboard, schedules, prescriptions, profile
   │  ├── doctors/                          # Public doctor listing and detail pages
   │  ├── home/                              # Homepage and its sections (Hero, FeaturedDoctors, etc.)
   │  └── patient/                             # Patient dashboard, appointments, payments, prescriptions, reviews, profile
   ├── components/
   │  ├── shared/                   # Navbar, Footer, Container, PageTitle, SectionTitle, ComboboxFilter, ConfirmDialog
   │  └── ui/                       # shadcn/ui primitives (button, dialog, table, select, sheet, etc.)
   ├── context/
   │  └── UserContext.jsx           # Global session/profile context
   ├── lib/
   │  ├── auth.js                   # Better Auth server configuration
   │  ├── auth-client.js             # Better Auth client instance
   │  ├── admin-utils.js              # Shared formatting, token, and debounce helpers
   │  └── utils.js                     # Tailwind class merge helper
   ├── assets/                      # Static assets (logo)
   └── proxy.js                     # Route protection (Next.js middleware)
```

## Installation

```bash
git clone https://github.com/md-saju-ahmed/medicare-connect-client.git
cd medicare-connect-client
npm install
```

## Environment Variables

Create a `.env` file in the project root:

| Variable               | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Base URL of the backend REST API consumed by the client            |
| `BETTER_AUTH_URL`      | Base URL Better Auth uses for its client/server configuration      |
| `MONGODB_URI`          | MongoDB connection string used by the Better Auth database adapter |
| `DB_NAME`              | Name of the MongoDB database Better Auth connects to               |
| `GOOGLE_CLIENT_ID`     | OAuth client ID for Google sign-in                                 |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret for Google sign-in                             |

## Running Locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Available Scripts

| Script          | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Starts the development server (Turbopack) |
| `npm run build` | Creates an optimized production build     |
| `npm run start` | Starts the production server              |
| `npm run lint`  | Runs ESLint                               |

## Routing & Page Structure

| Route                       | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `/`                         | Homepage with hero, featured doctors, specializations, stats, and testimonials |
| `/doctors`                  | Doctor listing with search, specialization filter, and sort                    |
| `/doctors/[id]`             | Doctor profile and appointment booking page                                    |
| `/about`                    | About page                                                                     |
| `/contact`                  | Contact page                                                                   |
| `/login`                    | Login page (email/password and Google)                                         |
| `/register`                 | Registration page (role selection: Patient or Doctor)                          |
| `/payment-success`          | Stripe payment confirmation handler                                            |
| `/payment-cancelled`        | Stripe payment cancellation page                                               |
| `/dashboard`                | Role-based dashboard overview                                                  |
| `/dashboard/appointments`   | Appointments view (role-dependent content)                                     |
| `/dashboard/payments`       | Payment history / cash flow records (role-dependent content)                   |
| `/dashboard/prescriptions`  | Prescription management (role-dependent content)                               |
| `/dashboard/profile`        | Profile management for doctors and patients                                    |
| `/dashboard/reviews`        | Patient review management                                                      |
| `/dashboard/schedules`      | Doctor schedule management                                                     |
| `/dashboard/manage-doctors` | Admin doctor verification and management                                       |
| `/dashboard/manage-users`   | Admin user management                                                          |
| `*` (unmatched)             | Custom 404 page                                                                |

## Authentication Flow

Authentication is handled by **Better Auth**, configured with:

- **Email/password sign-up and sign-in**, with role selection (Patient or Doctor) at registration.
- **Google OAuth** as a social sign-in provider.
- A **JWT plugin** issuing tokens used as `Authorization: Bearer` headers when calling the backend API.
- A **MongoDB adapter** for storing user accounts, with custom user fields (`role`, `gender`, `address`, `bloodGroup`, `dateOfBirth`, `phone`, `status`).
- A database hook that automatically creates a corresponding `doctors` record when a user registers with the `doctor` role.

Route protection is enforced by `src/proxy.js` (Next.js routing middleware), which checks for the Better Auth session cookie and redirects unauthenticated requests from any `/dashboard/*` route to `/login`, preserving the original destination as a `callbackUrl` query parameter.

On the client, `UserContext` loads the authenticated user's profile from the backend once a session is detected, and `DashboardContext` extends this within the dashboard layout to also load doctor-specific profile data when applicable.

## Role-Based Dashboard

The `/dashboard` layout renders a sidebar whose navigation items are determined by the signed-in user's role:

| Role        | Dashboard Sections                                                                 |
| ----------- | ---------------------------------------------------------------------------------- |
| **Patient** | Overview, My Appointments, Payment History, My Prescriptions, My Reviews, Profile  |
| **Doctor**  | Overview, Manage Schedules, Appointment Requests, Prescription Management, Profile |
| **Admin**   | Overview, Manage Users, Manage Doctors, Appointments Registry, Cash Flows          |

Each dashboard route uses a `useRoleGuard` hook to restrict access to allowed roles, redirecting unauthorized roles back to `/dashboard` and rendering a loading skeleton while the role is being resolved. Shared routes (such as `/dashboard/appointments` and `/dashboard/payments`) render a different feature component depending on the resolved role.

## UI/UX Features

- **Responsive design** across navigation, dashboards, listings, and forms using Tailwind breakpoints.
- **Framer Motion** animations applied to page sections, cards, sidebar navigation, and modals throughout the app.
- **Recharts** bar, line, and pie charts on the admin analytics dashboard.
- **Loading states** implemented with shadcn `Skeleton` components across dashboard pages, doctor listings, and profile sections.
- **Custom 404 page** with illustration and animated elements.
- **Toast notifications** (`react-hot-toast`) for success and error feedback on actions such as login, booking, and CRUD operations.
- **Dynamic page titles** set per page via a `PageTitle` component, and server-rendered metadata (including Open Graph data) for public and doctor detail pages.
- **Confirmation dialogs** (`ConfirmDialog`) for destructive actions such as deleting users or doctors.
- **Combobox filters** (`ComboboxFilter`) used across admin and public listing pages for filtering by role, status, specialization, and sort order.

## API Integration

The frontend communicates with a separate backend REST API at the base URL defined by `NEXT_PUBLIC_API_URL`. Requests are authenticated using a Bearer JWT obtained from Better Auth (`authClient.token()`) and sent with `Authorization` headers via a shared `buildHeaders` helper. Key integration points include:

- `users/me`, `doctors/me` — current user and doctor profile retrieval
- `doctors` — doctor listing and detail data
- `appointments` — appointment creation and management
- `payments`, `payments/create-checkout-session` — payment recording and Stripe Checkout session creation
- `reviews` — patient review submission and retrieval

Doctor detail pages additionally fetch data server-side (in `generateMetadata` and the page component) for SEO purposes.

## State Management & Data Fetching

There is no global state management library; state is handled through:

- **React Context** — `UserContext` (global session/profile) and `DashboardContext` (dashboard-scoped user and doctor profile state).
- **Component-level state** (`useState`, `useEffect`, `useMemo`, `useCallback`) for data fetching, filtering, and pagination within feature pages.
- **`useDebounce`** — a shared hook used to debounce search input before filtering.
- A simple in-memory module-level cache (used in the patient review page) to avoid redundant network calls within a session.

Data fetching uses the native `fetch` API directly within feature components and Next.js Server Components (for SEO metadata), rather than a dedicated fetching library.

## Forms & Validation

Forms are built with **React Hook Form**, using inline validation rules passed to `register()` (e.g. required fields, minimum length) rather than a separate schema validation library. The `Controller` component is used to integrate the custom `ComboboxFilter` component with React Hook Form where needed (e.g. role and gender selection on registration).

## Deployment Notes

The project is deployed on **Vercel**. As a standard Next.js App Router project, it requires no additional configuration file (such as `vercel.json`) to deploy — Vercel detects and builds Next.js projects automatically.

Before deploying, make sure to:

- Add all required environment variables (see [Environment Variables](#environment-variables)) in the Vercel project settings, for both Production and Preview environments.
- Update `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` OAuth redirect URIs in the Google Cloud Console to include the deployed domain.
- Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_URL` to point to the production backend rather than localhost.
- Confirm the backend API and MongoDB instance are reachable from Vercel's network.

`next.config.mjs` already allows remote images from any HTTPS/HTTP hostname, so no further image domain configuration is needed for doctor profile images or other remote assets served through `next/image`.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes with clear, descriptive messages.
4. Run `npm run lint` before pushing.
5. Open a pull request describing the change and its motivation.

## License

This project is licensed under the [MIT License](./LICENSE).
