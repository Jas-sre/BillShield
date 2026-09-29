# BillShield — Know every recurring payment before it surprises you

**Recurring-payment intelligence and cash-flow planning for Indian users.** BillShield brings bills, subscriptions,
EMIs, insurance premiums, investments and UPI AutoPay-style mandates into one calm timeline, shows how they affect the
balance in the coming days, and helps protect essential payments.

> **BillShield is not another UPI app.** It is a mandate-intelligence and cash-flow-planning layer that makes recurring
> obligations visible, understandable and easier to plan for. Actual payment and mandate actions stay inside the
> regulated UPI app or bank flow.

Built as a **DRUNIX Hackathon fintech prototype**. Everything is simulated, local and read-only in the real world — no
backend, no accounts, no API keys, no real money.

**Contents** — [Highlights](#1-highlights) · [Tech stack](#2-tech-stack) · [Setup](#3-setup) · [Features](#4-features)
· [Project structure](#5-project-structure) · [Demo persona and data](#6-demo-persona-and-data) · [Forecast
logic](#7-forecast-logic) · [Persistence and reset](#8-localstorage-persistence-and-reset) · [Demo-only
boundaries](#9-demo-only-boundaries) · [90-second demo script](#10-90-second-demo-script) · [Verification
checklist](#11-manual-verification-checklist) · [What *is* the website](#12-what-is-the-website-and-how-to-publish-it)

---

## 1. Highlights

- **One timeline for every recurring obligation** — 10 simulated mandates (bills, EMIs, insurance, investments,
  subscriptions) in a single view instead of scattered app reminders.
- **A projection, not just a list** — a 30-day cash-flow forecast shows the exact day the balance dips, how far below
  the comfort buffer it goes, and whether a real shortfall is coming.
- **Essentials protected first** — essential bills due before the next income are surfaced with the amount to keep
  aside (₹2,499 on the seed data).
- **Nothing is invisible** — every pause, resume, priority change and hide reports the resulting lowest projected
  balance, so the effect of a change is measured rather than assumed.
- **Honest by design** — the product never claims to move money or change a mandate; it hands the user back to the
  regulated UPI app or bank.
- **Judge-friendly** — a 60-second guided walkthrough, English + Tamil, dark mode, and a one-click **Start over** that
  restores the seed plan and the welcome screen.

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite 5 |
| UI | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS 3 (light theme, teal/emerald primary, indigo accent) |
| Icons | lucide-react (abstract line icons — never real brand logos) |
| Charts | Recharts (responsive area / donut / bar) |
| Motion | framer-motion (small, subtle effects only, respects reduce-motion) |
| State | React Context + `useReducer` (single store) |
| Persistence | Browser `localStorage` only |
| Routing | react-router-dom (`HashRouter`, so `dist/` works from any static host) |
| Tests | Vitest — 55 unit tests (forecast engine, insight copy, persistence, store reducer) |
| Theming | Light by default, optional dark mode via CSS variables |

No backend, no authentication, no database, no external APIs, no API keys, no payment gateway, and no real
UPI / NPCI / bank integration.

---

## 3. Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # strict typecheck + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm test           # vitest run (55 unit tests)
npm run test:watch # vitest in watch mode
```

Node 18+ is recommended (developed on Node 22).

**First run:** the welcome screen asks you to tick the demo-consent checkbox before the dashboard opens. Demo state is
then persisted in the browser, so on later visits you land straight in the dashboard. Use **Start over** (desktop
sidebar, or *More* → **Start over** on mobile) to return to the welcome screen with the seed data — see
[section 8](#8-localstorage-persistence-and-reset).

---

## 4. Features

**Onboarding (P0)** — welcome page with three benefit cards, the required demo-consent checkbox, and a
disabled-until-checked *Open my BillShield dashboard* button. You can also launch the guided demo straight from here.

**Overview dashboard (P0)** — balance hero with a plan-status chip, allocation bar, four metric cards, the next four
scheduled payments, a 14-day cash-flow chart with comfort-buffer line and low-balance band, three dynamic insight
cards, essential-payment protection, and locally-saved recent activity.

**Upcoming payments (P1)** — *This week / This month / All scheduled* tabs, a 14-day calendar strip that filters the
list, category filter, sort by due date / amount / priority, merchant search, empty states, and a tooltip explaining
the planned balance.

**Mandates (P1)** — summary cards (active, scheduled this month, optional spend, needing review), five tabs including
*Paused in plan*, search, a desktop table and mobile cards, and the ten actions: view details, mark essential /
important / optional, add reminder, simulate pause in plan, **keep active in plan (resume)**, open UPI app to manage,
hide from dashboard, restore to dashboard. Both pause and resume confirm through the same popup before anything
changes. An **Effect of your plan changes** panel quantifies what pausing or resuming
did — the new lowest projected balance next to the all-active baseline — with a *Keep all active in plan* button that
resumes everything at once. Every pause/resume toast reports the resulting lowest balance too.

**Cash-flow planner (P1)** — editable balance, income, income date and comfort buffer; a 30-day interactive forecast
chart with income and payment markers, below-buffer and negative regions, and a detailed tooltip; payment
prioritisation; four independent what-if scenarios (keep all, pause Adobe, defer Netflix, add income), each projected
on its own so the cards stay comparable whichever one is selected; and a generated recommended plan.

**Insights (P1)** — grouped dynamic cards (potential savings, subscription hygiene, essential readiness, cash-flow
pressure, review reminders), a spending-by-category donut, an essential vs important vs optional bar chart, and a
savings simulator with an *Apply this to my plan* action.

**Settings (P1)** — profile, language, accessibility (reduce motion, larger text, higher contrast), privacy notes,
notification preferences, restore hidden dashboard items, reset-all-demo-data with confirmation, and about.

**Notifications (P1)** — bell with unread count and a drawer with three seeded reminders, mark-as-read /
mark-all-as-read and persisted read state.

**Demo presenter mode (P2)** — "BillShield in 60 seconds": six guided steps with previous/next/skip, an overlay
walkthrough available from anywhere, reset-demo-state, business value copy and an architecture mini-diagram.

**Start over** — because demo state is persisted in `localStorage`, a labelled *Start over* control (desktop sidebar and
the mobile *More* sheet) clears the saved state, restores the seed plan and returns to the welcome/consent screen in one
click — no browser devtools needed.

**English + Tamil (P1)** — every screen renders through a translation helper; the header toggle switches the interface
text (merchant names intentionally stay English), and long Tamil strings wrap instead of overflowing badges, tabs or
menus.

**Dark mode** — light by default, with a persisted light/dark toggle in the header (and on the settings and welcome
screens). Semantic colours are CSS variables, so every surface, border, status chip and chart follows the theme.

**Accessibility** — skip-to-content link, focus-visible rings, focus-trapped modals that close on Escape, labelled
icons and live regions for toasts.

---

## 5. Project structure

```
billshield/
  index.html  vite.config.ts  vitest.config.ts  tsconfig.json  tailwind.config.ts  postcss.config.js
  src/
    main.tsx  App.tsx  index.css
    types/index.ts                  # strong domain types
    data/mockData.ts                # seed persona + 10 recurring payments
    data/translations.ts            # English + Tamil dictionaries and translator
    utils/currency.ts               # ₹ Indian-rupee formatting
    utils/dates.ts                  # timezone-safe ISO date helpers
    utils/forecast.ts               # THE forecast engine + payment queries + scenarios
    utils/insights.ts               # dynamic insight and copy generation
    utils/storage.ts                # loadDemoState / saveDemoState / resetDemoData
    utils/chartTheme.ts             # theme-aware chart colours
    utils/*.test.ts                 # vitest suites (forecast, insights, storage)
    context/BillShieldContext.tsx   # store wiring, derived metrics, UI state (modals, toasts, tour)
    context/demoReducer.ts          # pure reducer (unit tested on its own)
    context/demoReducer.test.ts
    hooks/useBillShield.ts  useTranslation.ts  useMandateActions.ts
    components/
      layout/     AppShell, DesktopSidebar, MobileBottomNav, TopHeader, PageHeader
      dashboard/  BalanceHeroCard, MetricCard, MoneyAllocationBar, EssentialProtection, RecentActivity
      payments/   PaymentCard, PaymentTimeline, PaymentDetailModal, PaymentModals
      mandates/   MandateTable, MandateCard, MandateActionsMenu, ManageMandateModal, SimulatePauseModal
      charts/     CashFlowChart, SpendingDonutChart, EssentialVsOptionalChart
      insights/   InsightCard, ScenarioCard
      common/     Modal, ConfirmDialog, DemoDataBadge, DisclaimerBanner, CategoryBadge, PriorityBadge,
                  StatusBadge, EmptyState, Tooltip, Toast, SearchInput, LoadingSkeleton, ErrorBoundary,
                  LanguageToggle, ThemeToggle, NotificationDrawer, DemoWalkthrough, MerchantIcon, Switch,
                  StartOverButton
    pages/        WelcomePage, DashboardPage, UpcomingPage, MandatesPage, CashFlowPage,
                  InsightsPage, SettingsPage, DemoModePage
```

---

## 6. Demo persona and data

| Field | Value |
| --- | --- |
| Name | Kavya Raman (KR) |
| City | Chennai, Tamil Nadu · age 22 |
| Profile | Student and part-time designer |
| Current available balance | ₹4,820 |
| Comfort buffer | ₹1,000 |
| Next expected income | ₹7,500 on 08 Oct 2026 ("Part-time design income") |
| Recurring commitments | ₹7,795 across 10 mandates in the visible-month window |
| Demo date | 28 September 2026 |
| Recurring payments | 10 (Airtel Mobile, Netflix, TNEB Electricity, Adobe Creative Cloud, Education EMI, Spotify, Health Insurance, SIP Investment, Google One, Wi-Fi Bill) |

Every figure in the interface is derived from `src/data/mockData.ts` through the forecast engine — nothing is
hard-coded in a component. With the seed data the app shows:

| Figure | Value |
| --- | --- |
| Current available balance | **₹4,820** |
| Scheduled in the next 7 days | **₹1,048** (₹399 essential — Airtel lands first) |
| Essentials due before the next income | **₹2,499** (Airtel, electricity, EMI) |
| Active mandates | **10** |
| Lowest projected balance | **₹473** on **07 October 2026** (one day below the comfort buffer) |
| Balance after simulating the Adobe pause | **₹1,672** |
| Scheduled this month / optional spend | **₹7,795** / **₹2,097** |
| Potential monthly savings flagged for review | **₹1,978** |

---

## 7. Forecast logic

`calculateCashFlowForecast({ startDate, days, startingBalance, incomeEvents, payments, comfortBuffer, scenarioOverrides })`
in `src/utils/forecast.ts` is the single source of truth. It:

1. Builds one record per day: `date`, `openingBalance`, `inflow`, `outflow`, `events`, `closingBalance`,
   `belowComfortBuffer`, `negativeBalance`.
2. Applies income events on their income date (and any scenario top-up).
3. Deducts a recurring payment on its due date **only when its status is `Active`**.
4. Excludes anything whose status is **`Paused in plan`** — pausing changes only the BillShield plan.
5. Keeps payments that are **hidden from the dashboard** in the projection: hiding is presentational only. Hidden items
   stay in cash-flow, upcoming, mandate search and payment details.
6. Supports what-if overrides: `pausePaymentIds`, `deferredPaymentIds` (moved out by one month) and `incomeAdjustment`.
   `previewForecast()` in the store layers an override **on top of the current plan** (used by the pause modal and the
   plan-improvement metric), while each what-if card on the cash-flow page is projected **independently** so the four
   cards remain comparable.
7. Returns the lowest balance and its date, days below the comfort buffer, first below-buffer date, totals and the
   ending balance.

Around the engine, `src/utils/forecast.ts` also exposes `getPaymentsDueInNextDays`, `getEssentialPaymentsBeforeIncome`,
`getActiveMandateCount`, `getOptionalSpend`, `getPotentialSavings`, `getSafeToSpendOrPlanningSummary`,
`getEssentialReadiness`, `getVisibleDashboardPayments`, the four scenario definitions and more. `src/utils/currency.ts`
provides `formatCurrencyINR()`, and `src/utils/insights.ts` turns the results into sentences — so the same numbers drive
the dashboard, charts, insights and modals.

---

## 8. localStorage persistence and reset

One key: `billshield.demo-state.v1` (see `src/utils/storage.ts`).

* `loadDemoState()` — reads and merges the stored state onto the seed (unknown/old versions fall back to the seed).
* `saveDemoState(state)` — writes after every change, silently degrading if storage is blocked.
* `resetDemoData()` — clears the key and returns a fresh seed state.

Persisted: onboarding completion, payments and their modified status, priority changes, paused-in-plan states,
hidden-from-dashboard states, reminder preferences, current balance edits, income edits, comfort buffer edits, language,
**theme (light/dark)**, notification read state, notification and accessibility preferences, the selected scenario, and
the savings-simulator target.

**How to reset:**

| Where | What it does |
| --- | --- |
| **Start over** — desktop sidebar / mobile *More* sheet | Clears everything, restores the seed plan **and** returns to the welcome/consent screen |
| Settings → *Privacy* → **Reset all demo data** | Same, with a confirmation dialog and an option to show the welcome screen again |
| Demo mode → **Reset demo state** | Re-seeds the plan but keeps you past onboarding |
| The error boundary | Offers a reset if a render error ever occurs |

Reset restores the original 10 seed payments, the ₹4,820 balance, the ₹7,500 income on 08 Oct 2026, the English UI, the
light theme, no paused-in-plan items, no hidden items, no reminders and the default notifications.

---

## 9. Demo-only boundaries

BillShield does **not** access a real bank account, live UPI transactions or payment history, and it does **not**
process, send, receive or move money. It cannot pause, revoke, cancel, create, update or modify a real UPI AutoPay
mandate, and it is not affiliated with NPCI, RBI, any bank or any UPI application. It offers no regulated investment,
lending or financial advice.

It never requests, stores or displays a UPI PIN, OTP, bank account number, card number, real transaction credential,
bank statement or real personal financial data.

The required disclaimer appears in the dashboard footer, on the settings page, on the demo-mode page and inside every
payment/mandate action modal:

> *BillShield is a hackathon prototype using simulated data. It does not access accounts, process payments, or change
> real UPI AutoPay mandates.*

Mandate actions use deliberately safe language: "Simulate pause in plan", "Paused in plan", "Open your UPI app to
manage", "This changes only your BillShield plan", "No real payment or mandate was changed". The UPI-app modal states
that a production integration *would* redirect the user to the app or bank where the mandate was created — this demo
does not.

---
