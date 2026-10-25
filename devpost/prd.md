---
doc: prd
status: approved
---

# Finaura — Product Requirements

Finaura is a personal finance assistant for adults in college and young professionals with limited monthly income or allowance. It helps them understand spending, savings goals, and likely month-end balance.
Source: scope.md > Who It's For, The Unique Kernel, and The Core Loop.

## The Core Journey

1. A new user sees an empty dashboard labeled Insufficient Data and can load clearly labeled fictional sample data or enter personal figures.
2. They enter current available balance, monthly income, expected future income and expenses, budget, transactions, and savings goals, or import the supported CSV. They review local category suggestions and correct them when needed.
3. Finaura calculates the current-month projection, summary, and status. If transaction history supports them, it also shows spending patterns, possible recurring charges, and month comparisons.
4. The user sees the early-warning reason and practical suggestions, sets dated savings goals, and reviews a calculated savings plan.
5. The user asks about the displayed finances. Personal questions use a local deterministic assistant. In sample mode, four fixed preset questions may ask Gemini to explain a server-calculated fictional summary.
6. The user changes one planned expense and sees deterministic before/after projections and hypothetical goal progress without changing actual saved progress.

The proof is an explained cash warning followed by a measurable what-if change (scope.md > The Core Loop).

## Screens and Layout

One responsive dashboard, in this order:

1. Projected month-end balance, labeled status, projection basis, and reason.
2. Monthly income, expenses so far, remaining budget, and available balance cards.
3. Category breakdown, daily trend, supported category comparisons, unusual transactions, and potential subscriptions.
4. Early-warning panel with trigger, evidence-supported category context, and a practical next step.
5. Up to three savings goals and the calculated savings plan.
6. Add/import actions, one what-if simulator, and current-month report.
7. Ask Finaura chat with local free-text handling and clearly labeled sample-only Gemini presets.

On small screens, keep the same order. Pair status colors with text labels and icons. Charts and reports include readable text summaries.

## Look and Feel

Use soft lilac-to-mint surfaces and vivid violet-to-blue-to-teal gradients on the projection hero and primary actions. Keep text high-contrast and uncluttered. Reserve green, amber, and red for labeled On Track, Caution, and Potential Shortfall states. Use readable typography and short, honest explanations.

## Features and Behavior

### 1. Smart Expense Analysis

Users add, edit, and remove dated expenses with merchant/description, amount, category, and discretionary flag, or import a supported CSV covering up to 90 days. A local keyword map suggests categories; users can override suggestions. Unknown descriptions remain Uncategorized. Invalid CSVs apply none of their rows.

- As a student or young professional, I want to enter or import and categorize expenses so I can understand where my money goes.
- [ ] A valid manual entry and valid CSV update transaction and category totals.
- [ ] Invalid amounts/dates or malformed CSVs show an actionable error and leave existing data unchanged.
- [ ] Suggestions are editable; unmatched descriptions remain Uncategorized.

### 2. AI Financial Insights

The app generates practical recommendations from calculated figures and supported history. Personal figures use deterministic local rules and text. Gemini may explain a server-created fictional sample summary; it cannot supply or change exact numeric results.

- As a user, I want suggestions grounded in my actual financial results so I can decide what to change.
- [ ] Every recommendation shows a traceable trigger such as a calculated shortfall, category change, or goal gap.
- [ ] Personal insights do not call Gemini; sample prompts contain only preset questions and fictional calculated summaries.
- [ ] Unsupported data produces an honest “not enough information” message, not invented numbers.

### 3. Personalized Savings Goals

Users can create up to three goals with a name, target, deadline, and amount already saved. The app shows remaining amount and progress. Simulator results remain hypothetical.

- As a user, I want a target and deadline so I can track progress toward saving.
- [ ] Each goal shows target, deadline, saved amount, remaining amount, and calculated progress.
- [ ] Invalid goal values are rejected; what-if changes never alter actual saved progress.
- [ ] Users can edit/remove goals in-session; refresh/close clears them.

### 4. Ask Finaura Chatbot

Users can type questions about budgets, balances, spending, subscriptions, goals, and projections. A local intent matcher answers supported questions from current calculations; unknown questions receive a help response. Free text is never sent to Gemini, even in sample mode.

- As a user, I want to ask about my dashboard in plain language so I can understand what to do next.
- [ ] Supported intents return current calculated facts; unknown intents do not guess.
- [ ] Personal figures and typed questions never reach the Gemini client.
- [ ] The answer names missing data when a supported answer cannot yet be calculated.

### 5. Recurring Subscription Detection

Look across the available 90-day transaction history for the same normalized merchant. A potential recurrence requires two or more similar charges 25–35 days apart and amounts within 20%. Estimate monthly cost as the average matched amount and show matched dates. A match is a heuristic, not confirmation of a subscription.

- As a user, I want likely repeated charges highlighted so I can notice their monthly cost.
- [ ] Qualifying charges are labeled Potential recurring and show dates and the calculated monthly estimate.
- [ ] One charge, dissimilar amounts, or insufficient history is not shown as a confirmed recurrence.
- [ ] Detected historical charges are not added again as future planned expenses.

### 6. Upcoming Cash-Shortage Prediction

The basic projection is **current available balance + expected income before month-end − expected remaining expenses**. Current balance already reflects past transactions; do not subtract past spending again. With at least 14 covered calendar days of current-month discretionary history, estimate future unplanned spending as average daily discretionary spending × remaining days. Exclude known upcoming expenses. Below 14 days, show “Not enough spending history to estimate additional spending.” Allow an optional user-entered daily estimate. Always label basic and adjusted projections separately.

- As a user, I want a projected month-end balance so I can prepare for a possible shortfall.
- [ ] Calculator checks prove the stated basic formula and no double-counting of transactions.
- [ ] At 14 eligible days the history estimate uses average-times-days; below 14 it is omitted and the exact message appears.
- [ ] The UI identifies whether it shows the basic, history-adjusted, or manual-estimate projection.

### 7. Spending-Pattern Explanations

Compare current month-to-date category spending with the same elapsed days of the previous month only when both periods have at least 14 covered calendar days. Flag a category increase at 25% or more. Flag an unusual transaction only when at least five prior category transactions exist and the new amount is over twice their median. Explain these as simple heuristics, not certainty.

- As a user, I want explanations of category increases and unusual transactions so I can spot patterns.
- [ ] A trend names both periods and their calculated values and appears only with sufficient history.
- [ ] An unusual-spend note names the transaction and category-median basis and appears only with enough reference transactions.
- [ ] Insufficient history shows a message instead of a trend or anomaly claim.

### 8. Realistic Savings-Plan Generator

For a goal with a future deadline, calculate remaining target, months until deadline rounded up (minimum one), and required monthly contribution. Compare it with projected month-end surplus above the safety buffer, assuming future months resemble the current plan; show that assumption. If data is missing or the needed contribution exceeds estimated capacity, show the calculated gap and explain that the plan is not currently affordable. Never guarantee success.

- As a user, I want to know the required monthly contribution and whether it fits my current plan.
- [ ] Tests verify amount remaining divided by months to deadline, rounded up to a minor unit.
- [ ] Feasibility compares the contribution with projected surplus above the buffer.
- [ ] Missing inputs or passed deadlines do not produce a confident plan.

### 9. Financial Dashboard and Monthly Reports

The current-month report displays monthly income, expenses so far, remaining budget when set, current balance, basic and applicable adjusted projections, category totals, and daily trend. Prior-month comparisons use only provided dated history. Estimated values are clearly marked.

- As a user, I want a monthly summary of income, spending, budget, and projection.
- [ ] Report values match inputs and calculator results; remaining budget equals limit minus expenses so far.
- [ ] Missing history/category data is disclosed and never fabricated.
- [ ] Chart information has an accessible text summary.

### 10. Financial Early-Warning System

Use the history/manual adjusted projection when available, otherwise the basic projection. Status order: Insufficient Data; Potential Shortfall below zero; Caution at zero, below buffer, or over a set monthly limit; then On Track. State the trigger. Describe categories as spending context, not as the mathematical cause of a balance already included in current balance.

- As a user, I want an explained warning and practical action so I can respond before month-end.
- [ ] Missing current balance or expected income/expense entries shows Insufficient Data and names what is missing.
- [ ] Tests verify negative, zero, below-buffer, over-limit, and on-track precedence cases.
- [ ] A warning names its projection basis and trigger; categories appear only when supported.

### 11. What-If Savings Simulator

Change one known remaining expense and recalculate the applicable projection. Show before/after amounts and the exact difference. The user can preview the difference against a goal; reset restores original values.

- As a user, I want to test an expense change before changing my plan.
- [ ] Reducing an expense by X increases the projection by exactly X.
- [ ] Hypothetical goal progress is separate from actual progress and is not saved automatically.
- [ ] Reset restores the original expense, projection, and goal.

### 12. Explainable AI Finance Copilot

Personal finance explanations and all typed chat questions remain local and deterministic. Four preset questions may use Gemini only in clearly labeled fictional sample mode: “Why might my projected balance become negative?”, “Which spending category could I reduce?”, “What happens if I reduce dining expenses by 10%?”, and “What practical steps could help me save more?” Finaura calculates the 10% result first; exact figures remain from the calculator.

- As a user, I want a plain-language explanation of how Finaura reached a result.
- [ ] All four sample presets return an explanation or deterministic fallback; dining uses the calculated 10% scenario.
- [ ] Tests prove requests include only an allowlisted preset and fictional summary, never personal amounts, transactions, CSV rows, or free text.
- [ ] Unsupported numeric claims/model errors cannot change the displayed result.

## States and Boundaries

- **First use:** show Insufficient Data and offer personal entry or clearly labeled sample data.
- **Missing inputs:** name required forecast fields; never show On Track without enough data.
- **Insufficient history:** keep the basic projection; omit history-based trends, unusual-spend, or subscription claims as needed and explain why.
- **No categories/goals:** show helpful empty states without fabricated breakdowns or progress.
- **CSV error:** describe row problems, preserve existing values, and link to the supported format.
- **Unknown chat intent:** offer supported topics rather than guessing.
- **Gemini failure:** keep calculations and use a deterministic fictional-data explanation.
- **Period:** forecast the current month only; use at most 90 days of prior transactions for analysis.
- **Privacy/age:** intended audience and Gemini experience are 18+; no personal financial data or free text reaches Gemini.
- **Persistence:** user data lasts only in browser memory until refresh/close; no account, database, or bank connection.

## Product Decisions

- Preserve the approved audience, monthly cash-flow purpose, React/Vite/Tailwind, Node/Express, and Gemini for fictional sample explanations only.
- All twelve requested features are required MVP behaviors in narrow, functional forms, not placeholders or silently deferred items.
- Use current-month projection and up to 90 days of transaction history, up to three dated goals, one what-if at a time, one CSV format, and session-only data.
- Recurring heuristic: same normalized merchant, two or more charges 25–35 days apart, amounts within 20%; label only as potential.
- Category trend threshold: at least 25% above the same elapsed days in the prior month, with at least 14 covered days in both periods.
- Unusual-spend threshold: greater than twice the category median, with at least five prior category transactions.
- Savings-plan feasibility assumes future months resemble the current projected surplus above the buffer; disclose this assumption.
- Keep history estimate, manual daily estimate, and known planned expenses separate to prevent double counting.

## What We're Building

A single-user dashboard implementing all twelve items: expense analysis, grounded insights, dated goals and savings plans, local chat, potential recurring detection, month-end prediction, evidence-based pattern explanations, monthly reporting, early warnings, deterministic what-if, and preset Gemini explanations for fictional samples. Arithmetic and statuses are deterministic and tested.

## Deferred From the POC

- Longer history, additional CSV formats, cross-device persistence, accounts, and collaboration are deferred to keep the product local and single-user.
- Free-form generative finance answers, personalized Gemini calls, AI-generated calculations, banking, external alerts, and money movement are deferred for privacy, security, and complexity.

## Possible Later Enhancements

Longer reports, richer merchant matching, configurable thresholds, more currencies, and multiple users can follow after the constrained features work.

## Non-Goals

- Bank access, money transfers, or initiating transactions.
- Sending personal figures, raw transactions, CSV data, or free-text questions to Gemini.
- Treating a heuristic detection, forecast, or savings plan as guaranteed.
- Investment, credit, tax, or other broad financial advice.
- Requiring an account or deployment to explore the sample.

## Open Questions

- No product decisions are blocking this MVP. INR/paise, a zero default safety buffer, and an 18+ confirmation for Gemini-only sample questions are implemented assumptions documented in `spec.md`.
