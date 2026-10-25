---
doc: spec
status: approved
---

# Finaura — Technical Spec

## How This Works, In Plain Language

Finaura has a browser app and a small local service that run on your computer. The browser app is the screen you use. React builds that screen, Vite runs it while we work, and Tailwind styles it. When you enter figures, the browser sends them to the local Express service, which runs the financial formulas once and sends the results back. This keeps the rules in one place for the dashboard and its tests.

Your numbers stay in the open browser session and are not saved after you refresh or close it. The local service does not save them either. For your own figures, Finaura writes a plain-language explanation from the calculated result without using Gemini. In the clearly labeled fictional sample mode, four preset questions can call Gemini. The service chooses the question and sample figures itself, so personal figures and free-text prompts never reach Gemini. The Gemini key stays in a server-only `.env` file, never in the browser app.

We are keeping one project folder, one dashboard, one month, no accounts or database, and no deployment requirement. This avoids extra services and setup while preserving the forecast, warning, simulator, charts, and sample explanation needed for the demo.

## The Core Journey Through the System

1. The dashboard opens with a clearly labeled fictional sample. The user can explore it or switch to personal mode and enter their own values. A separate adult confirmation gates the sample Gemini questions; local calculations and personal chat work without it.
2. The browser holds the current session in React memory. It sends the current financial inputs to `POST /api/forecast` on the local Express service.
3. Express validates the request. `financeCalculator.js` calculates the basic projection, optional 14-day spending estimate, status, category totals, and what-if result using integer minor units. The service returns those results; it does not save the input.
4. React displays the returned values in summary cards, warning panel, charts, goal, and simulator. For personal data, an in-app explanation template uses the returned result; it does not call Gemini.
5. In sample mode, the user selects one of four preset questions. The browser sends only that preset ID to `POST /api/sample-explanation`. The server loads its own fictional sample fixture, calculates the matching facts, and sends only that sample summary and fixed question to Gemini. The answer returns to the Copilot panel beside the calculator’s exact figures.
6. If Gemini is unavailable, a deterministic sample explanation appears. The dashboard and financial calculations continue to work.

```text
Manual inputs / CSV
        │
        ▼
React dashboard ── POST /api/forecast ──> Express validator
        ▲                                      │
        └──────── calculated results <── financeCalculator

Preset question ID ──> sample-only route ──> sample fixture + calculator
                                           └──> Gemini ──> checked explanation

Personal figures ──> in-app deterministic explanation; never sent to Gemini
```

PRD ref: `prd.md > The Core Journey`, `prd.md > 6. Upcoming Cash-Shortage Prediction`, `prd.md > 10. Financial Early-Warning System`, `prd.md > 1. Smart Expense Analysis`, `prd.md > 11. What-If Savings Simulator`, `prd.md > 3. Personalized Savings Goals`, and `prd.md > 12. Explainable AI Finance Copilot`.

## Stack

| Part | Choice | Why it fits this project |
|---|---|---|
| Runtime | Node.js 24 LTS (24.21.0 current LTS at research time) | Runs the Express service and frontend tools; use the supported LTS line. |
| Language | JavaScript ES modules | One language for the beginner-friendly browser and server code. |
| Frontend | React 19.3 + Vite 8.3 | React organizes the dashboard into parts; Vite starts a fast local development page. Vite 8 requires Node 20.19+ or 22.12+, so Node 24 fits. |
| Styling | Tailwind CSS 4.3 through `@tailwindcss/vite` | Uses the requested utility styling with Vite’s current integration. |
| Backend | Express 5 | Provides two small local endpoints: deterministic forecast and sample-only explanation. |
| Charts | Recharts 3.x | Provides responsive charts, tooltips, and keyboard/screen-reader navigation; an adjacent text summary remains required. |
| CSV | Papa Parse 5.x | Reads the selected file in the browser, reports parsing errors, and can create the downloadable sample CSV. |
| AI | Gemini Interactions API with `gemini-3.5-flash-lite`, called with Node's built-in `fetch` | Gemini is used only for four preset explanations of server-generated fictional sample data. This avoids an extra SDK dependency while keeping the key server-only. |
| Calculation tests | Node’s built-in `node:test` and `node:assert` | Tests the server’s pure calculation functions without adding another testing framework. |
| Run both processes | `concurrently` | Starts Vite and Express with one beginner-friendly command. |

Use the versions named above as the starting point, then save the exact installed versions in `package-lock.json` during the build. Do not install an older Vite/Tailwind tutorial configuration; use the official Vite 8 and Tailwind 4 guides linked below.

## Where It Runs and How Someone Tries It

- **Runtime:** locally on Windows. Node.js 24 LTS and npm are required. Vite serves the browser app at `http://localhost:5173`; Express listens at `http://localhost:3001`. Vite proxies `/api` requests to Express so the browser uses one local origin.
- **Install:** from the repository root, run `npm install`.
- **Start:** run `npm run dev`, then open `http://localhost:5173`. The script starts Vite and `node --env-file-if-exists=server/.env --watch server/src/index.js` together; Express uses port 3001.
- **Test calculations:** run `npm test`, mapped to `node --test server/test/financeCalculator.test.js server/test/privacyBoundary.test.js`. This uses Node’s built-in test runner and does not call Gemini.
- **Check the production bundle:** run `npm run build`, mapped to `vite build`.
- **Gemini setup:** copy `server/.env.example` to `server/.env`, then put the API key in `GEMINI_API_KEY` in that local file. Do not paste the key into chat, React files, or any `VITE_*` variable. During the build, configure `.gitignore` to ignore `.env` and `.env.*` while allowing `.env.example`.
- **Without a key or when Gemini is unavailable:** sample questions use deterministic explanations; all dashboard calculations remain usable.
- **Demo recording:** use the fictional sample, show its forecast and warning, try the dining reduction preset, then show a user-entered example and its local explanation. Deployment is optional; a locally recorded short demo video and a public GitHub repository are still required for submission.

## Look and Feel

Use a spacious single-page dashboard with a soft lilac-to-mint background, deep navy/indigo surfaces, and prominent violet-to-blue-to-teal gradients on the hero, primary actions, and decorative accents. Keep a clear type hierarchy and readable labels. Reserve green, amber, and red for the matching financial statuses and pair each with a text label and icon. Keep charts keyboard reachable, provide concise tooltips, and include text summaries for screen readers. Stack dashboard sections in the PRD order on narrow screens, and check text contrast over all gradients during visual review.

PRD ref: `prd.md > Screens and Layout` and `Look and Feel`.

## Components

### `DashboardApp`

Owns the active session, source mode (`sample` or `personal`), transaction history, up to three goals, form inputs, latest analysis result, and loading/error messages. It resets to an empty state on refresh; loading the sample restores the clearly labeled fictional fixture.

Implements `prd.md > The Core Journey` and `States and Boundaries`.

### `BalanceHero`

Shows the basic and applicable adjusted month-end projection, status label, and reason. It labels which projection drives the status and identifies when an estimate is unavailable.

Implements `prd.md > 6. Upcoming Cash-Shortage Prediction` and `prd.md > 10. Financial Early-Warning System`.

### `FinancialSummary`

Shows the user-entered monthly income summary, expenses so far, remaining budget (or that no limit was set), and current available balance.

Implements `prd.md > Screens and Layout`, `prd.md > 6. Upcoming Cash-Shortage Prediction`, and `prd.md > 9. Financial Dashboard and Monthly Reports`.

### `SpendingCharts`

Uses Recharts for the category breakdown and current-month daily trend. It renders only facts in the forecast response, provides text labels/tooltips, and supplies a text summary. Empty categories use the PRD empty state.

Implements `prd.md > Screens and Layout`, `prd.md > 1. Smart Expense Analysis`, and `prd.md > 9. Financial Dashboard and Monthly Reports`.

### `TransactionList and ExpenseAnalyzer`

Shows editable/removable entries, applies deterministic keyword category suggestions, and summarizes category totals. It presents supported category trends, unusual-spend flags, and potential recurring charges with their evidence and limits.

Implements `prd.md > 1. Smart Expense Analysis`, `prd.md > 5. Recurring Subscription Detection`, and `prd.md > 7. Spending-Pattern Explanations`.

### `EarlyWarningPanel`

Shows the reason for the selected status, relevant categories when transaction data supports them, and nonnumeric practical suggestions. It never invents a category or a figure.

Implements `prd.md > 10. Financial Early-Warning System`.

### `TransactionEntry`

Accepts an expense date, amount, category, and whether it is discretionary. It updates the session input and requests a fresh forecast. Known remaining expenses are separate entries so the simulator can adjust one future expense.

Implements `prd.md > 1. Smart Expense Analysis`.

### `CsvImporter`

Uses Papa Parse to read a local selected file. It checks the supplied header/sample format, dates, amounts, categories, and discretionary markers before applying any rows. A failed import leaves the current session unchanged. A download action creates a sample CSV from the shared fictional fixture.

Implements `prd.md > 1. Smart Expense Analysis` and `prd.md > States and Boundaries`.

### `WhatIfSavingsSimulator`

Selects one known remaining expense, accepts a lower amount or reduction, calls the forecast service with the changed value, and shows the before/after projection and hypothetical goal effect. Reset restores the original session values.

Implements `prd.md > 11. What-If Savings Simulator`.

### `SavingsGoalCard`

Manages up to three goals with name, target, deadline, saved amount, remaining amount, progress, and a savings-plan estimate. It keeps hypothetical what-if progress visually separate from actual saved progress.

Implements `prd.md > 3. Personalized Savings Goals` and `prd.md > 8. Realistic Savings-Plan Generator`.

### `InsightsPanel and MonthlyReport`

Shows practical local recommendations with a visible calculation trigger and a current-month report from available data. It reports insufficient evidence when comparisons or patterns cannot be supported.

Implements `prd.md > 2. AI Financial Insights` and `prd.md > 9. Financial Dashboard and Monthly Reports`.

### `CopilotPanel`

Provides typed questions answered by a local intent matcher from current calculated results. In clearly labeled sample mode it also presents four fixed preset question buttons and displays Gemini’s checked explanation or deterministic fallback. Personal values and free-text prompts stay local.

Implements `prd.md > 4. Ask Finaura Chatbot`, `prd.md > 12. Explainable AI Finance Copilot`, and `States and Boundaries`.

### `Adult Confirmation`

Identifies Finaura as intended for adults 18+. The sample Gemini experience stays unavailable until the user confirms they are 18 or older. This is an audience boundary, not identity verification.

Implements `prd.md > States and Boundaries`.

### `Finance API Client`

A small `src/lib/api.js` wrapper for forecast and sample-explanation requests. It converts failed requests to clear UI messages and never includes the Gemini key.

Implements `prd.md > 6. Upcoming Cash-Shortage Prediction`, `prd.md > 12. Explainable AI Finance Copilot`, and `prd.md > States and Boundaries`.

## Data Model

### Browser session

`DashboardApp` keeps the current values in React memory only. Refreshing or closing the tab clears them. There is no account, browser storage, server database, or cloud save in the POC. Sample data can be loaded again. The age confirmation can be held in memory for the session too.

- `sourceMode`: `sample` or `personal` (used for display and deciding which explanation behavior to show; it is never sufficient by itself to authorize a Gemini request).
- `monthlyIncomeMinor`: optional entered full-month summary amount.
- `currentBalanceMinor`: required current available balance.
- `expectedIncome`: dated income expected before month-end; an empty list is allowed after the user confirms none is expected.
- `expectedExpenses`: dated known future expense entries with `id`, label, category, amount, and whether the expense is discretionary.
- `monthlyLimitMinor`: optional monthly spending limit.
- `safetyBufferMinor`: optional minimum buffer; zero is the current PRD assumption when unset.
- `transactions`: dated past expense rows with amount, category, and `isDiscretionary`.
- `totalSpendingSoFarMinor`: fallback when there are no usable transaction rows; never add it on top of transactions.
- `manualDailyDiscretionaryEstimateMinor`: optional daily estimate used only when the user chooses it; multiplied by remaining days and labeled separately from the history estimate.
- `goals`: up to three goals, each with id, name, target, deadline, and amount already saved.
- `whatIf`: optional selected future expense and adjusted amount.
- `adultConfirmed`: in-memory confirmation used only to show the sample Gemini controls; it is not identity verification.

Financial amounts cross the API as integer minor units to avoid decimal floating-point calculation errors. The browser displays amounts with one configured currency formatter. **Currency assumption for review:** use INR and paise for the MVP, based on the current workspace locale; there is no currency conversion. Confirm or change this in review before implementation.

### Forecast result

The response is derived, not stored. It includes the basic projection, history/manual estimate if available, adjusted projection, `projectionBasis`, status and reason, expenses so far, remaining budget, category and daily totals, actionable warnings, trend/anomaly/recurring evidence, goal progress and savings-plan capacity, and what-if result. The basic formula is current balance + expected income - known remaining expenses. With at least 14 distinct current-month discretionary transaction dates, estimate average daily discretionary spending times remaining days, then subtract known future discretionary expenses to avoid counting them twice. With fewer than 14 eligible days, omit the history estimate and use a manual daily estimate only when supplied. Server calculation rules follow all twelve numbered behavior headings in `prd.md`. The calculation receives an explicit `asOfDate` so month boundaries and thresholds can be tested with fixed dates.

### Sample fixture and CSV

`shared/sampleScenario.js` contains clearly labeled fictional data spanning up to 90 days, with at least 14 covered current-month days, repeated merchants for the subscription heuristic, enough prior-month category data to demonstrate a trend, a known expense for the simulator, and dated savings goals. Both React and the server import this fixture. Papa Parse creates the downloadable sample CSV from the same fixture, avoiding duplicate sample numbers.

### Data movement

- Manual entries and imported rows stay in the browser session, then go to the local `/api/forecast` endpoint for calculation. They are not written to disk or retained by Express.
- Manual chat questions are matched and answered in the browser from the latest returned calculation; no free-text prompt or personal data is sent to Gemini.
- Personal financial values never enter the `/api/sample-explanation` request. That route accepts only an allowlisted preset ID, rebuilds its context from the server’s fictional fixture, and calls Gemini with that synthetic context.
- The server calls the Interactions API with `store: false`. Only a fixed question and calculated fictional sample summary are in that request; this does not override the unpaid-service terms, so no personal data is sent.

## Local API Contracts

### `POST /api/forecast`

This local endpoint accepts only the current single-month calculation input. Amounts are integer minor units; dates are ISO calendar dates.

```json
{
  "asOfDate": "2026-10-25",
  "currencyCode": "INR",
  "monthlyIncomeMinor": 3200000,
  "currentBalanceMinor": 850000,
  "expectedIncome": [{ "date": "2026-10-28", "amountMinor": 400000 }],
  "expectedExpenses": [
    { "id": "bill-1", "label": "Phone bill", "category": "Bills", "amountMinor": 120000 }
  ],
  "monthlyLimitMinor": 3000000,
  "safetyBufferMinor": 200000,
  "transactions": [
    { "date": "2026-10-12", "amountMinor": 45000, "category": "Dining", "isDiscretionary": true }
  ],
  "totalSpendingSoFarMinor": null,
  "goals": [{ "id": "goal-1", "name": "Emergency fund", "targetMinor": 1000000, "savedMinor": 300000, "deadline": "2026-12-31" }],
  "whatIf": { "expenseId": "bill-1", "adjustedAmountMinor": 90000 }
}
```

If `transactions` is empty, `totalSpendingSoFarMinor` may be supplied. The API never adds both sources. The response includes the basic and adjusted projections, status/reason, spending and budget totals, category/daily totals, warnings, pattern findings, potential recurring charges, grounded insights, goal-progress and savings-plan arrays, and what-if result. Missing required information returns `200` with `INSUFFICIENT_DATA` and names the missing fields. Invalid amounts or row shapes return a clear 400 response; unexpected service errors return a generic 500 response without logging financial request bodies.

### `POST /api/sample-explanation`

The browser sends only a preset ID from this fixed list: `negative-projection`, `reduce-category`, `reduce-dining-10`, or `practical-savings`.

```json
{ "presetId": "reduce-dining-10" }
```

The server rejects any other body or preset, loads `shared/sampleScenario.js`, calculates the applicable result (including a 10% reduction of the known planned dining expense), and builds a fixed prompt. It does not accept amounts, transaction rows, categories, or free text from the browser on this endpoint.

```json
{ "explanation": "The sample result indicates…", "source": "gemini", "facts": { "status": "POTENTIAL_SHORTFALL", "projectionMinor": -12345, "diningCutMinor": 6000, "projectionAfterDiningCutMinor": -6345 } }
```

When the key is missing, quota is reached, the model call times out, or generated prose fails the numeric-output guard, return the matching deterministic template with `source: "fallback"`. The UI keeps all exact numeric values from `/api/forecast`.

## File Structure

```text
finaura/
├── index.html                         # Vite page shell
├── package.json                       # dependencies and npm scripts
├── package-lock.json                  # exact dependency versions from build
├── vite.config.js                     # Tailwind plugin and /api proxy
├── .gitignore                         # ignores local secrets and generated files
├── README.md                          # setup, demo, and sample-data instructions
├── shared/
│   └── sampleScenario.js              # fictional fixture shared by browser/server
├── src/
│   ├── main.jsx                       # React entry
│   ├── App.jsx                        # responsive dashboard, forms, local chat, and session state
│   ├── index.css                      # Tailwind import and Finaura's violet-blue-teal design
│   ├── components/
│   │   └── SpendingCharts.jsx          # lazy-loaded accessible Recharts views
│   └── lib/
│       ├── api.js                      # calls local Express endpoints
│       ├── csv.js                      # Papa Parse validation and sample export
│       ├── financeInput.js             # rupee-to-paise conversion and category suggestions
│       ├── chatIntents.js               # local typed-question matching and answers
│       └── formatCurrency.js           # single configured currency formatting
├── server/
│   ├── .env.example                    # secret-free server env example
│   ├── src/
│   │   ├── index.js                    # Express app and local port
│   │   ├── routes/
│   │   │   ├── forecast.js             # POST /api/forecast
│   │   │   └── sampleExplanation.js     # preset-only POST /api/sample-explanation
│   │   ├── services/
│   │   │   ├── financeCalculator.js    # deterministic forecasts and spending analysis
│   │   │   └── sampleExplanation.js     # fictional sample context and optional Gemini call
│   │   └── data/
│   │       └── presets.js              # preset IDs and fixed question text
│   └── test/
│       ├── financeCalculator.test.js   # formulas, thresholds, goals, and what-if
│       ├── csvAndCategories.test.js    # import validation and category rules
│       ├── chatIntents.test.js          # local chat answers and no-guess fallback
│       └── privacyBoundary.test.js     # sample-only Gemini boundary and fallback
└── devpost/
    ├── learner-profile.md              # ignored by Git
    ├── scope.md                        # approved product scope
    ├── prd.md                          # approved product requirements
    └── spec.md                         # this technical blueprint
```

Generated `node_modules/` and `dist/` folders are not listed.

## External Services and Dependencies

### Gemini API (sample explanations only)

- **Client:** Node.js built-in `fetch`; no additional Gemini SDK package.
- **Model:** `gemini-3.5-flash-lite`, using the unpaid tier for a small, low-volume demo. Pricing is currently free of charge within the model’s free quota; rate limits and free-tier availability may change. Google marks unpaid prompts/responses as usable to improve its products and may use human review, so the app sends only fictional sample data and fixed preset questions.
- **Key setup:** create and restrict the key using Google AI Studio's current key guidance. As of May 28, 2026, new AI Studio keys default to authentication keys; unrestricted standard keys are rejected. Recheck the official key guide during setup because this policy can change.
- **Call:** server-side `POST https://generativelanguage.googleapis.com/v1beta/interactions`; headers include `content-type: application/json` and server-only `x-goog-api-key` from `GEMINI_API_KEY`.
- **Request body:** `{ "model": "gemini-3.5-flash-lite", "store": false, "input": "<fixed instruction, preset question, calculated fictional sample facts>" }`. The preset question is selected from `server/src/data/presets.js`. No free-text input, personal transaction, CSV row, or personal calculation is included.
- **Response:** read the interaction's `output_text` (with a compatible `outputs[].content[].text` fallback), reject numeric claims, and return the checked explanation plus separately calculated fictional facts.
- **Output guard:** the AI supplies a short explanation only. Exact financial values remain rendered from the calculator response; discard model text containing numeric claims and show the matching deterministic explanation template instead.
- **Age boundary:** Google’s current additional terms require API users to be 18+ and prohibit API clients directed to or likely accessed by people under 18. Finaura’s intended audience and Copilot confirmation are therefore adult 18+ only. Recheck the linked terms before sharing or deployment.
- **Secret:** store the key only in `server/.env`; do not commit it or expose it through Vite. The `.env.example` stays placeholder-only.
- **Fallback:** no key, quota/rate limit, timeout, or model error results in a deterministic sample explanation. The user’s forecast still works.

Official sources: [Gemini getting started](https://ai.google.dev/gemini-api/docs/get-started), [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview), [API key setup](https://ai.google.dev/gemini-api/docs/api-key), [unpaid/paid terms](https://ai.google.dev/gemini-api/terms), [pricing](https://ai.google.dev/gemini-api/docs/pricing).

### Major libraries

- [React](https://react.dev/learn) 19.3; [Vite](https://vite.dev/guide/) 8.3; [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite) 4.3.
- [Express 5 installation](https://expressjs.com/en/starter/installing/) and [routing](https://expressjs.com/en/5x/guide/routing/).
- [Recharts responsive container](https://recharts.github.io/api/ResponsiveContainer/), [tooltips](https://recharts.github.io/en-US/api/Tooltip/), and [accessibility API](https://recharts.github.io/en-US/api/). Keep the text summary even with the accessibility layer.
- [Papa Parse documentation](https://www.papaparse.com/docs) for local-file parsing, error reports, and CSV generation.
- [Node.js test runner](https://nodejs.org/api/test.html) and [environment-file flag](https://nodejs.org/api/cli.html#--env-file-if-existsfile).
- [concurrently](https://github.com/open-cli-tools/concurrently) for the single `npm run dev` command.

## Important Failure Modes

- **Express forecast service is stopped or returns invalid input:** keep the values in the open page, show “Could not update the forecast,” and offer Retry. Do not show stale output as current.
- **CSV headers or rows are invalid:** show the row/field problem, apply none of the file, preserve existing session data, and link the generated sample CSV.
- **Gemini key is missing, request fails, or free quota is unavailable:** show the deterministic explanation for that preset. Do not disable the dashboard or alter calculator results.
- **Insufficient data or fewer than 14 eligible history days:** follow `prd.md > Financial Early-Warning System` and `States and Boundaries`; show the basic projection when possible and clearly label the missing estimate.

## What Was Simplified and Why

- One local Express service handles calculations and sample explanations instead of separate hosted services or a database; it keeps the project to the requested stack and one computer.
- Personal figures get deterministic local explanations; Gemini is used only with the synthetic sample and fixed preset questions. This honors the learner’s unpaid-tier choice and the provider’s data-use terms while preserving a visible Gemini demo.
- Typed Copilot questions use local intent matching for personal and sample figures; Gemini is limited to the four fixed fictional-sample prompts. The 10% dining question uses a deterministic what-if calculation before Gemini explains the sample result.
- Data exists for the current browser session only. No account, persistent storage, bank connection, or multi-period history is included.
- The CSV supports one supplied format. Papa Parse handles quoted fields and reports parsing issues without custom CSV parsing code.
- The dashboard is one responsive screen with up to three goals and one active scenario. There is no deployment; the demo runs locally for recording.

## Decisions and Open Issues

### Confirmed choices

- **Learner choice:** React, Vite, Tailwind CSS, Node.js, Express, and Gemini were requested as the stack.
- **Learner choice:** keep figures in the open app only; refresh/close clears them.
- **Learner choice:** Express is the single deterministic calculator; personal values are not sent to Gemini.
- **Learner choice:** use Recharts for the responsive charts and Papa Parse for browser-side CSV import.
- **Learner choice:** use the unpaid Gemini service only with labeled fictional sample data and four preset questions; personal-data explanations stay deterministic and local.
- **Service constraint:** target adults 18+ only for the Gemini-enabled demo, following the API terms.
- **Implementation choice:** use one root `package.json`, JavaScript ES modules, `concurrently`, no database, no router, and Node’s built-in test runner to reduce setup.
- **Implementation choice:** use deterministic keyword classification and a small local intent matcher; uncertain matches remain Uncategorized or get an honest unsupported-question response.
- **Implementation choice:** implement recurring, trend, and anomaly detection as transparent threshold heuristics, not machine learning or financial advice.

### Useful learning moment

The PRD left unclear whether figures should be saved after closing. We compared session-only memory with browser storage. Session-only means refreshing clears entries; it avoids adding storage and keeps the demonstration’s personal figures on the current page. This decision is recorded in `prd.md > Deferred From the POC` and in the data model above.

### Assumptions to review

- **Currency:** INR/paise is the MVP display and input currency; currency conversion is not included.
- **Adult audience:** Finaura is intended for adults. The sample Gemini controls require an 18+ confirmation; this is not identity verification.
- **Safety buffer default:** the optional buffer defaults to zero, following the PRD assumption.
- **Unpaid API availability:** the Gemini feature has a deterministic fallback. Check the model and quota when configuring a key because service availability can change.

No deployment target is needed for the local proof of concept. A short demo video and a public GitHub repository remain required at `6-ship`.
