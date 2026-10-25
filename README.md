# Finaura

Finaura helps college students and young professionals understand whether their available money can cover the rest of the month, and what they could adjust to save more.

## Run on Windows

Requirements: Node.js 24 LTS and npm.

1. In PowerShell, run `npm.cmd install` from the project folder.
2. Start the browser app and local service with `npm.cmd run dev`.
3. Open the Vite URL printed by the terminal (usually <http://127.0.0.1:5173/>). If that port is busy, Vite prints another one.
4. The fictional sample loads first. Click **Use my numbers** to enter personal figures; those are kept for the current browser session only.

To enable AI explanations for fictional sample data only, copy `server/.env.example` to `server/.env` and add a Google AI Studio key as `GEMINI_API_KEY`. Never use a `VITE_` variable or put the key in frontend files. Without the key, the four sample prompts use deterministic explanations. Personal figures and typed chat questions never go to Gemini.

## What works

- Deterministic basic and month-end balance projections with a 14-day history estimate rule.
- Personal data entry, transaction editing, category suggestions, and CSV import with all-or-nothing validation.
- Category and daily spending charts, spending trends, unusual purchase flags, and potential recurring charge detection.
- Early warnings, up to three savings goals, goal contribution estimates, and an expense what-if simulator.
- Local question answering for personal figures and four optional Gemini questions for the fictional sample.

Figures are session-only: refreshing or closing the page clears them. There are no bank connections or money transfers. Finaura is for planning support and is not financial advice.

## Check the project

- `npm.cmd test` runs deterministic calculations and privacy-boundary tests.
- `npm.cmd run build` builds the production frontend.

CSV columns: `date, merchant, amount, category, isDiscretionary`. Amounts are decimal rupees; dates must be within the previous 90 days. Invalid files do not partially import.
