---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. See the sample cash forecast and early warning**
  Becomes usable: The app opens to a polished dashboard with clearly labeled fictional data, deterministic month-end projection, status and reason, summary cards, and a usable early-warning panel.
  Why now: This proves Finaura's main money question end to end first; its UI feedback can shape the remaining dashboard before we fill it with features.
  PRD ref: `prd.md > The Core Journey`, `prd.md > 6. Upcoming Cash-Shortage Prediction`, `prd.md > 9. Financial Dashboard and Monthly Reports`, `prd.md > 10. Financial Early-Warning System`, and `prd.md > States and Boundaries`
  Spec ref: `spec.md > How This Works, In Plain Language`, `spec.md > The Core Journey Through the System`, `spec.md > Components`, `spec.md > Data Model`, `spec.md > Local API Contracts`, and `spec.md > File Structure`
  Build: Finish bootstrapping and shared sample fixture; implement validation, the deterministic basic projection/status engine, local forecast endpoint, responsive gradient dashboard, sample loading, summary/warning display, and calculator tests.
  Verify (mechanical): Run `npm.cmd test` and `npm.cmd run build`; start `npm.cmd run dev`, request the sample forecast, and confirm the dashboard renders without browser/server errors.
  Learner check: Open the dashboard, inspect the sample figures and status explanation, and check whether the gradient colors and information order feel right.
  Commit: Pending local Git author identity

- [ ] **2. Enter expenses, goals, and ask Finaura locally**
  Becomes usable: A user can enter personal figures and dated expenses, edit/remove transactions, set goals, ask a question, and get updated calculations and a local deterministic answer.
  Why now: This gives the full personal-data journey without any Gemini dependency and makes privacy behavior explicit before AI is added.
  PRD ref: `prd.md > 1. Smart Expense Analysis`, `prd.md > 3. Personalized Savings Goals`, `prd.md > 4. Ask Finaura Chatbot`, `prd.md > 6. Upcoming Cash-Shortage Prediction`, `prd.md > 10. Financial Early-Warning System`, and `prd.md > 12. Explainable AI Finance Copilot`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Local API Contracts`, and `spec.md > Important Failure Modes`
  Build: Add personal input forms, required-field/Insufficient Data states, transaction add/edit/remove, keyword category suggestions and override, up to three dated goals, local intent-matched chat, and current-calculation explanation templates.
  Verify (mechanical): Run `npm.cmd test` and `npm.cmd run build`; verify missing inputs, manual transaction totals, suggested/overridden categories, goal progress, supported and unsupported chat prompts, and that personal requests never call Gemini.
  Learner check: Enter a small personal example, ask Finaura about the balance, and confirm the answer matches the displayed calculator result.
  Commit: Pending local Git author identity

- [ ] **3. Import history and explain spending patterns**
  Becomes usable: A user can import the supported CSV, see spending charts and a monthly report, and inspect evidence-based insights, unusual spending, category changes, and potential recurring charges.
  Why now: Historical analysis depends on the transaction model from Slice 2; keeping all thresholds together makes low-history behavior verifiable.
  PRD ref: `prd.md > 1. Smart Expense Analysis`, `prd.md > 2. AI Financial Insights`, `prd.md > 5. Recurring Subscription Detection`, `prd.md > 7. Spending-Pattern Explanations`, `prd.md > 9. Financial Dashboard and Monthly Reports`, and `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Local API Contracts`, `spec.md > External Services and Dependencies`, and `spec.md > Important Failure Modes`
  Build: Add local CSV validation/import and sample download; category and daily charts with text summaries; 14-day forecast estimate; supported prior-month category comparison, anomaly and recurring heuristics; and grounded insights/report views.
  Verify (mechanical): Run `npm.cmd test` and `npm.cmd run build`; check malformed CSV rollback, under/over 14 history days, trend/anomaly/recurring thresholds, chart data summaries, and privacy boundary.
  Learner check: Import the sample CSV, inspect its chart and insight explanations, then try a malformed file and verify the imported history is preserved.
  Commit: Pending local Git author identity

- [ ] **4. Set a savings plan and test a what-if change**
  Becomes usable: A user can create a dated savings goal, see a feasible or not-yet-feasible monthly plan, reduce a planned expense, and compare the projection and hypothetical goal progress.
  Why now: These actions build directly on the forecast and goals, while hypothetical values remain separate from real values.
  PRD ref: `prd.md > 3. Personalized Savings Goals`, `prd.md > 8. Realistic Savings-Plan Generator`, `prd.md > 10. Financial Early-Warning System`, and `prd.md > 11. What-If Savings Simulator`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Local API Contracts`, and `spec.md > Important Failure Modes`
  Build: Add savings-plan contribution and capacity math, assumptions/disclosures, one-at-a-time planned expense simulator, before/after projection, hypothetical goal impact, and reset behavior.
  Verify (mechanical): Run `npm.cmd test` and `npm.cmd run build`; verify deadline rounding, insufficient data, exact expense-reduction projection delta, unchanged actual goals, reset, and warning status updates.
  Learner check: Reduce a sample expense, compare projected balance and hypothetical goal impact, then reset and check that original values return.
  Commit: Pending local Git author identity

- [ ] **5. Explain fictional sample results with Gemini**
  Becomes usable: In clearly labeled fictional sample mode, four preset questions receive a Gemini explanation or deterministic fallback; personal values and all typed questions stay local.
  Why now: Gemini is added after the calculation and privacy boundaries are already proven, so AI availability cannot block the financial features.
  PRD ref: `prd.md > 2. AI Financial Insights`, `prd.md > 4. Ask Finaura Chatbot`, `prd.md > 12. Explainable AI Finance Copilot`, and `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components`, `spec.md > Data movement`, `spec.md > Local API Contracts`, `spec.md > External Services and Dependencies`, and `spec.md > Important Failure Modes`
  Build: Add the sample-only preset endpoint and server-side Gemini client; keep the key in `server/.env`; accept only allowlisted preset IDs; send fictional calculated facts only; use deterministic fallback on missing key, invalid output, quota, or failure.
  Verify (mechanical): Run `npm.cmd test` and `npm.cmd run build`; prove arbitrary prompts and personal payloads are rejected/not sent, all presets fall back without a key, and exact results remain from the calculator. If a key is configured, test one fictional sample preset.
  Learner check: Try all four presets in clearly labeled sample mode, then switch to personal data and confirm explanations are local.
  Commit: Pending local Git author identity

## Hands-on Checkpoints

- [x] Early usable behavior explored — learner tried the initial dashboard and reported that the UI was unattractive and the requested features were missing; the dashboard was redesigned and all planned feature flows were implemented in response.
- [ ] Final kick-the-tires exploration and feedback completed — after all slices and mechanical checks, learner tries the core journey and awkward inputs.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be completed after the build]
Route and stops: [to be completed after the build]
Edit outcome: [to be completed after the build]
Reflection: [to be completed after the build]
Activity mode: [to be completed after the build]

## Revisions

- The learner asked for a fast build and reported that the earlier dashboard did not deliver the requested product. The closely connected calculation and dashboard features were implemented and verified together in one integrated pass; all five planned feature groups remain in the app. The local commit is pending the repository's missing Git author name and email.
