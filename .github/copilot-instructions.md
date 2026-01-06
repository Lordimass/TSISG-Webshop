# GitHub Copilot Instructions for SHY-Webshop

This document provides essential guidance for AI coding agents working on the SHY-Webshop codebase. It outlines the project's architecture, key developer workflows, and important conventions to ensure immediate productivity.

## 1. Big Picture Architecture

The SHY-Webshop is a full-stack application with a React frontend and Netlify Functions backend, interacting with Supabase and Stripe for data persistence and payment processing.

-   **Frontend (`src/`):**
    -   Built with React and Vite.
    -   `src/main.tsx`: Entry point, initializes Google Analytics (GA4) and renders the main `App` component.
    -   `src/app.tsx`: Defines the main application structure, including React Router for navigation and various Context Providers (`LoginContext`, `SiteSettingsContext`, `NotificationsContext`) for global state management.
    -   `src/pages/`: Contains top-level page components (e.g., `home`, `checkout`, `products`, `staff`).
    -   `src/components/`: Reusable UI components used across different pages.
    -   `src/lib/`: Client-side utility functions, API integrations (e.g., `netlifyFunctions.tsx` for interacting with Netlify Functions, `supabaseRPC.tsx` for Supabase Remote Procedure Calls), and type definitions.
    -   **Data Flow:** Frontend components interact with Netlify Functions (via `src/lib/netlifyFunctions.tsx`) and Supabase RPCs (via `src/lib/supabaseRPC.tsx`) to fetch and update data.

-   **Backend (`netlify/`):**
    -   **Netlify Functions (`netlify/functions/`):** Serverless functions written in TypeScript (`.mts` files) that handle API requests, integrate with external services like Stripe and Google Analytics, and perform database operations via Supabase.
        -   Examples: `createCheckoutSession.mts`, `stripeWebhook.mts`, `fetchGA4Analytics.mts`, `updateProductData.mts`.
    -   **Netlify Lib (`netlify/lib/`):** Backend utility functions and type definitions shared among Netlify Functions.
        -   Examples: `getSupabaseClient.ts`, `stripe.ts`, `types/stripeTypes.ts`, `types/supabaseTypes.ts`.
    -   **Integration Points:**
        -   **Stripe:** Handled by functions like `createCheckoutSession.mts` and `stripeWebhook.mts`. Webhooks are configured to listen for `checkout.session.completed` and `refund.created` events.
        -   **Supabase:** Accessed via `getSupabaseClient.ts` in Netlify Functions and `supabaseRPC.tsx` on the frontend.
        -   **Google Analytics (GA4):** `fetchGA4Analytics.mts` retrieves analytics data.

## 2. Critical Developer Workflows

-   **Development Server:**
    -   To start the local development server and Stripe webhook listeners, run the `launch-dev-server.ps1` script.
    -   Command: `.\launch-dev-server.ps1` (from the project root in PowerShell).
    -   This script automatically sets up Stripe webhooks for local testing and starts the Netlify development server.
    -   **Note:** Stripe CLI login expires every 90 days; run `stripe login` to refresh if authentication errors occur.

-   **Build Process:**
    -   The project uses Vite for building the frontend.
    -   Command: `npm run build`

-   **Linting:**
    -   ESLint is configured for code quality.
    -   Command: `npm run lint`

## 3. Project-Specific Conventions and Patterns

-   **TypeScript:** The entire codebase (frontend and backend) is written in TypeScript. Adhere to strict typing.
-   **Netlify Functions:** All backend logic resides in `netlify/functions` as `.mts` files. These are serverless functions.
-   **Context API:** React's Context API is heavily used for global state management (e.g., `LoginContext`, `SiteSettingsContext`, `NotificationsContext`). When adding new global state, consider using a new Context.
-   **Supabase RPCs:** For database interactions from the frontend, prefer using Supabase Remote Procedure Calls (RPCs) via `src/lib/supabaseRPC.tsx` when possible, rather than direct API calls.
-   **Styling:** CSS modules or plain CSS files are used, typically co-located with their respective components (e.g., `src/components/basket/basket.css`).

## 4. Integration Points and External Dependencies

-   **Stripe:**
    -   Frontend integration: `@stripe/react-stripe-js`, `@stripe/stripe-js`.
    -   Backend integration: `stripe` (Node.js library).
    -   Webhook handling: `netlify/functions/stripeWebhook.mts` and related files in `netlify/lib/stripeEndpoints/`.
-   **Supabase:**
    -   Frontend and Backend integration: `@supabase/supabase-js`.
    -   Client initialization: `netlify/lib/getSupabaseClient.ts`.
-   **Google Analytics (GA4):**
    -   Frontend: `react-ga4` and `src/appHooks.tsx` (`initGA4`).
    -   Backend: `@google-analytics/data` and `google-auth-library` (`netlify/functions/fetchGA4Analytics.mts`, `netlify/lib/betaAnalyticsDataClient.ts`).
-   **MDX Editor:** `@mdxeditor/editor` is used for rich text editing, likely in staff-facing content management.
-   **Image Transformation:** `sharp` is used in `netlify/functions/imageTransformer.mts` for image processing.
-   **GitHub API:** `octokit` is used, likely for integrations related to staff or reporting features.

## 5. Key Files and Directories

-   `src/app.tsx`: Main React application setup and routing.
-   `src/lib/netlifyFunctions.tsx`: Centralized utility for calling Netlify Functions from the frontend.
-   `src/lib/supabaseRPC.tsx`: Centralized utility for making Supabase RPC calls from the frontend.
-   `netlify/functions/`: Directory containing all serverless functions.
-   `netlify/lib/getSupabaseClient.ts`: Standardized way to get a Supabase client in Netlify Functions.
-   `netlify/lib/stripe.ts`: Utility for Stripe API interactions on the backend.
-   `netlify/lib/types/`: Shared TypeScript type definitions for backend services.
-   `src/lib/types.ts`: Shared TypeScript type definitions for frontend components.
-   `launch-dev-server.ps1`: Script for setting up the local development environment.
