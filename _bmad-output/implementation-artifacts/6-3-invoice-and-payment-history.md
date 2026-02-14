# Story 6-3: Invoice & Payment History

## Summary
Added a dedicated Billing page (`/billing`) that displays the user's current subscription details, payment method, and invoice history fetched from Stripe. The sidebar navigation was updated from "Pricing" to "Billing".

## Changes

### Backend — Stripe Service
- **`apps/api/src/services/stripe.service.ts`** — Added 2 functions + 2 interfaces:
  - `getCustomerInvoices(customerId, userId)` — Calls `stripe.invoices.list()`, maps to `InvoiceData[]` (id, date, amount in cents, currency, status, invoicePdf URL, hostedInvoiceUrl, description)
  - `getCustomerPaymentMethod(customerId, userId)` — Calls `stripe.customers.retrieve()` with expanded `invoice_settings.default_payment_method`, returns `PaymentMethodData | null` (type, last4, brand for cards)
  - Both log cost via `logCost`

### Backend — Billing Service
- **`apps/api/src/features/billing/billing.service.ts`** — Added `getBillingDetails(userId)`:
  - Returns `{ subscription, invoices, paymentMethod }` for subscribed users
  - Returns `{ subscription: null, invoices: [], paymentMethod: null }` for free users (no 404)
  - Uses `Promise.all` for parallel Stripe API calls

### Backend — Controller & Routes
- **`apps/api/src/features/billing/billing.controller.ts`** — Added `getBillingDetailsHandler`
- **`apps/api/src/features/billing/billing.routes.ts`** — Added `GET /details` (billingLimiter + requireAuth, no CSRF for GET)

### Frontend — Hook
- **`apps/web/src/features/billing/hooks/useBillingDetails.ts`** — New TanStack Query hook:
  - `queryKey: ['billing-details']`, fetches `GET /api/billing/details`
  - Returns `{ subscription, invoices, paymentMethod, isPending, isError, refetch }`

### Frontend — BillingPage
- **`apps/web/src/features/billing/pages/BillingPage.tsx`** — New page with:
  - **SubscriptionCard**: Plan name (from PRICING_CONFIG), status badge (Active/Trialing/Past Due/Canceled), next billing date, payment method (brand + last4), price/month, "Manage Plan" link to `/pricing`
  - **Free user card**: "Free" plan with "View Plans" CTA linking to `/pricing`
  - **InvoiceList**: Each invoice shows date, status badge (Paid/Pending/Void/Failed), description, formatted amount (€/$ with cents), PDF download button or View link
  - **Empty state**: CreditCard icon + "No invoices yet" message
  - **Loading state**: Skeleton card + 3 skeleton invoice rows
  - **Error state**: AlertCircle icon + error message + Retry button

### Frontend — Navigation
- **`apps/web/src/router.tsx`** — Added `/billing` route with `BillingPage`
- **`apps/web/src/components/layout/Sidebar.tsx`** — Renamed "Pricing" → "Billing", path `/pricing` → `/billing`
- **`apps/web/src/components/layout/AppLayout.tsx`** — Added `/billing: 'Billing'` to pageTitles

## Test Results
- **API**: 206/206 passed (3 new billing details tests)
- **Web**: 281/281 passed (13 new BillingPage tests)
- **TypeScript**: 0 errors in both apps
- **Note**: 2 pre-existing failures in `render.job.test.ts` (unrelated — missing `downloadBuffer` mock in r2.service)

## New Test Files
- **`apps/web/src/features/billing/pages/BillingPage.test.tsx`** — 13 tests across 4 groups:
  - Loading: skeleton renders
  - Error: error message + retry button
  - Free user: free plan card + empty invoices + View Plans link
  - Subscribed user: subscription card (plan name, status, billing date, payment method, Manage Plan link), invoice list (items, PDF download, View link, formatted amounts), trialing status

## Architecture Decisions
- **Single aggregated endpoint** (`GET /details`): Combines subscription, invoices, and payment method in one request to minimize frontend API calls.
- **No database changes**: All invoice/payment data comes from Stripe API in real-time.
- **Graceful free user handling**: Returns null subscription instead of 404, allowing the page to show a "Free Plan" card.
- **Sidebar renamed**: "Pricing" → "Billing" — Billing is the broader concept (subscription status + invoices), while Pricing (plan selection) is accessible via "Manage Plan".
- **Invoice card layout**: Uses card-based list (matching app patterns) rather than HTML tables (no table component in the UI library).
