import { createSampleScenario } from '../../../shared/sampleScenario.js';
import { calculateForecast, formatMinor } from './financeCalculator.js';
import { presetQuestions } from '../data/presets.js';

export function buildSampleExplanationContext(presetId, asOfDate = new Date().toISOString().slice(0, 10)) {
  const preset = presetQuestions[presetId];
  if (!preset) throw new Error('Choose one of the sample questions.');
  const sample = createSampleScenario(asOfDate);
  const result = calculateForecast(sample);
  const topCategory = result.categoryTotals[0];
  const dining = result.categoryTotals.find((row) => row.name === 'Dining');
  const plannedDiningMinor = sample.expectedExpenses.filter((row) => row.category === 'Dining').reduce((sum, row) => sum + row.amountMinor, 0);
  const diningCutMinor = Math.round(plannedDiningMinor * 0.1);
  const facts = {
    status: result.status,
    projectionMinor: result.adjustedProjectionMinor,
    statusReason: result.statusReason,
    topCategory: topCategory?.name || 'no supported category yet',
    topCategoryMinor: topCategory?.amountMinor || 0,
    diningCutMinor,
    projectionAfterDiningCutMinor: result.adjustedProjectionMinor == null ? null : result.adjustedProjectionMinor + diningCutMinor,
    estimateSource: result.estimateSource,
  };
  const summary = `Fictional sample only. Current calculated status: ${facts.status}. Projected balance: ${formatMinor(facts.projectionMinor)}. Explanation trigger: ${facts.statusReason}. Largest category: ${facts.topCategory}, ${formatMinor(facts.topCategoryMinor)}. Reducing the known planned dining expense by ten percent improves the projection by ${formatMinor(facts.diningCutMinor)}, resulting projection ${formatMinor(facts.projectionAfterDiningCutMinor)}.`;
  return { question: preset.question, facts, summary, fallback: preset.fallback };
}

export async function explainFictionalSample(presetId) {
  const context = buildSampleExplanationContext(presetId);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { explanation: context.fallback, source: 'fallback', facts: context.facts };

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({ model: 'gemini-3.5-flash-lite', input: `Explain these calculated facts to a beginner in two plain-language sentences. Do not state any numbers, amounts, percentages, dates, or new financial facts; the app displays exact figures separately. The data is fictional. Fixed question: ${context.question}\n${context.summary}`, store: false }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json();
    const text = data.output_text || data.outputs?.flatMap((item) => item.content || []).map((item) => item.text || '').join(' ') || '';
    const numericClaim = /\d|₹|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand|million|percent|percentage|rupees|inr)\b/i;
    if (!text.trim() || numericClaim.test(text)) throw new Error('Explanation did not pass the numeric-claim check.');
    return { explanation: text.trim(), source: 'gemini', facts: context.facts };
  } catch {
    return { explanation: context.fallback, source: 'fallback', facts: context.facts };
  }
}
