import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFinanceQuestion } from '../../src/lib/chatIntents.js';
import { calculateForecast, formatMinor } from '../src/services/financeCalculator.js';
import { createSampleScenario } from '../../shared/sampleScenario.js';

test('typed questions answer from the active calculated values', () => {
  const scenario = createSampleScenario('2026-10-25');
  const forecast = calculateForecast(scenario);
  const answer = answerFinanceQuestion('Will my money last this month?', scenario, forecast);
  assert.ok(answer.includes(formatMinor(forecast.adjustedProjectionMinor)));
  assert.ok(answerFinanceQuestion('Can I afford my remaining expenses this month?', scenario, forecast).includes(formatMinor(forecast.adjustedProjectionMinor)));
});

test('personal what-if questions use a local future expense calculation', () => {
  const scenario = createSampleScenario('2026-10-25');
  const forecast = calculateForecast(scenario);
  const answer = answerFinanceQuestion('What happens if I reduce dining expenses by 10%?', scenario, forecast);
  assert.match(answer, /raise the projected month-end balance/);
  assert.match(answer, /actual plan and savings goals are unchanged/);
});

test('unsupported questions do not invent an answer', () => {
  const scenario = createSampleScenario('2026-10-25');
  const answer = answerFinanceQuestion('Will crypto go up tomorrow?', scenario, calculateForecast(scenario));
  assert.match(answer, /I can explain your month-end projection/);
});
