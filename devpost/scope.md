---
doc: scope
status: approved
---

# Finaura

Finaura is a personal finance assistant for adult college students and young professionals with limited monthly income or allowance. It helps them understand their spending, save toward goals, and see whether their money can last through the month.

## The Unique Kernel

Finaura combines a deterministic month-end early warning with a what-if savings simulator: users see what their available balance may be, understand the calculated risks, and try a practical change. A privacy-safe Copilot explains the results: personal figures stay local and deterministic, while Gemini may explain only clearly labeled fictional sample data through preset questions.

## Who It's For

Adults (18+) in college and young professionals who have limited monthly income or allowance, may have little financial knowledge, and want to control spending without running short before month-end. They need a simple, approachable way to track expenses, understand patterns, and make a savings plan.

## The Core Loop

The user enters income, balance, expenses, and goals or imports transaction history. Finaura organizes spending, shows a monthly report, flags upcoming cash risks, and explains trends or recurring charges only when there is enough evidence. The user asks a question, tries a savings change, and checks whether their goal is achievable with the available information.

## Inspiration & Identity

Finaura should feel modern, polished, approachable, and easy to understand. Its visual direction uses a soft lilac-to-mint surface with vivid violet, blue, and teal gradients. Financial status colors remain reserved for labeled on-track, caution, and shortfall meanings.

## Why This Matters to the Learner

The learner wants to build Finaura for the Devpost Build With AI: Basics hackathon and help young adults make clearer spending and savings decisions. They are a beginner developer and want step-by-step help building and testing the project.

## What "Working" Looks Like

With fictional sample data or the user's own entries, Finaura shows a calculated monthly balance and budget, category spending, and any supported trend or recurring-payment findings. It explains a warning and a realistic savings option, lets the user test a change, and shows progress toward dated savings goals. Insufficient or uncertain data is labeled honestly. A one-minute demo shows the sample dashboard, a possible shortfall, one expense change, and the calculated explanation behind the result.

## Required MVP Features

All twelve features below are required in a narrow, functional proof of concept. The implementation must not replace them with static cards or decorative controls.

1. **Smart Expense Analysis**
   - User story: As a student or young professional, I want to enter expenses or import a CSV and categorize transactions so I can understand where my money goes.
   - Acceptance: A valid manual entry or supported CSV updates transaction totals and category spending; invalid imports are rejected without changing existing data.
2. **AI Financial Insights**
   - User story: As a user, I want practical suggestions tied to my calculated income, spending, and goals so I can decide what to change.
   - Acceptance: Every displayed recommendation cites a calculated amount, category, threshold, or goal fact; personal figures use local deterministic text, and Gemini receives only fictional sample facts.
3. **Personalized Savings Goals**
   - User story: As a user, I want to set a target amount and deadline and track what I have saved so I can see my progress.
   - Acceptance: A saved goal shows its target, deadline, saved amount, remaining amount, and calculated progress; hypothetical simulator savings never change actual saved progress.
4. **Ask Finaura Chatbot**
   - User story: As a user, I want to ask about budgeting, saving, and the figures on my dashboard so I can understand what to do next.
   - Acceptance: The assistant answers supported personal-data questions using local calculated results and clearly says when it cannot answer; no personal question or financial data is sent to Gemini.
5. **Recurring Subscription Detection**
   - User story: As a user, I want likely recurring payments identified from my transactions so I can notice their estimated monthly cost.
   - Acceptance: Repeated merchant charges are labeled as potential recurring payments, with an estimate grounded in observed transactions; one-off or insufficient history is not presented as a confirmed subscription.
6. **Upcoming Cash-Shortage Prediction**
   - User story: As a user, I want to see whether my balance may fall below zero before month-end so I can prepare.
   - Acceptance: The app calculates the basic projection from current available balance plus expected future income minus expected remaining expenses, shows the assumptions, and displays an honest status.
7. **Spending-Pattern Explanations**
   - User story: As a user, I want to understand category changes and unusually large expenses when enough history exists so I can spot patterns.
   - Acceptance: Any trend or unusual-spend message is based on dated transaction history and shows its comparison; when data is insufficient, the app says so instead of guessing.
8. **Realistic Savings-Plan Generator**
   - User story: As a user, I want a savings plan based on my goal deadline and projected available money so I can judge whether the target is achievable.
   - Acceptance: A plan shows its calculated contribution and feasibility assumptions; missing or insufficient financial data prevents a confident plan and is explained.
9. **Financial Dashboard and Monthly Reports**
   - User story: As a user, I want one clear report for income, expenses, remaining budget, spending categories, and month-end projection so I can understand my month at a glance.
   - Acceptance: The report displays values from user input or calculations, clearly distinguishes unavailable values, and includes readable category and month summaries.
10. **Financial Early-Warning System**
    - User story: As a user, I want a warning that identifies the trigger and a practical action so I can respond before running short.
    - Acceptance: Each warning states the calculated reason, identifies relevant categories only when supported, and labels On Track, Caution, Potential Shortfall, or Insufficient Data in text.
11. **What-If Savings Simulator**
    - User story: As a user, I want to change one expense assumption and immediately see how it affects my projection and goal so I can compare options.
    - Acceptance: A changed expense produces a deterministic before-and-after projection and hypothetical goal effect; reset restores the original figures and actual savings.
12. **Explainable AI Finance Copilot**
    - User story: As a user, I want plain-language answers that explain how Finaura reached its financial results so I can trust and act on them.
    - Acceptance: Every numeric result comes from Finaura's deterministic calculator. Personal-data explanations remain local; Gemini is limited to preset questions about clearly labeled fictional sample data and cannot invent financial figures.

## The POC Boundary

- One adult user, one local responsive dashboard, and session-only data; no account, database, or cloud sync.
- Forecast the current month. Use up to 90 days of dated transactions when available for prior-month comparison and potential recurring-payment detection.
- Include manual entries, one supported CSV format, deterministic transaction analysis, goal tracking, savings-plan generation, local chat/insights, early warnings, and one what-if scenario at a time.
- Include all twelve features as working, narrow MVP behaviors. The 90-day transaction history, rules, and sample scenario are limited to what is needed to demonstrate them; no bank connection or money movement.
- Keep numeric calculations deterministic and testable. Personal financial figures and free-text questions are not sent to Gemini; Gemini may answer only fixed preset questions using server-provided fictional sample results.
- Use the requested React, Vite, Tailwind CSS, Node.js, Express, and Gemini stack. Keep secrets server-side and out of Git.

This expands the original 2–4-hour proof-of-concept estimate. To keep the full feature list achievable, the MVP uses small rule-based versions, a single dashboard, a fixed CSV format, and synthetic data. It remains a larger build than the original boundary, so each feature will be delivered and verified in slices; no item in this list is silently deferred.

## Later

Broader CSV formats, longer history, multi-user accounts, automatic bank connections, real-time notifications, and open-ended generative answers about personal financial data may be considered after the twelve MVP features work.

## Explicitly Cut

- Bank integrations, automatic account synchronization, and real-money transfers: they add sensitive access and financial risk without proving the assistant's calculations.
- Sending personal financial figures or free-text questions to Gemini: the unpaid-tier experience is limited to fictional sample data and fixed questions.
- Investment, credit, tax, or other broad financial advice: the product focuses on budgeting, cash flow, spending, and savings goals.
- Claims that a repeated payment is certainly a subscription, that a savings plan is guaranteed, or that an estimate is a fact: Finaura labels evidence and assumptions.
