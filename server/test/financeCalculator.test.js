import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateForecast, validateForecastInput } from '../src/services/financeCalculator.js';
import { createSampleScenario } from '../../shared/sampleScenario.js';

const baseInput = (overrides = {}) => ({
  asOfDate: '2026-10-20', currencyCode: 'INR', currentBalanceMinor: 100000,
  expectedIncome: [], expectedExpenses: [], transactions: [], goals: [],
  monthlyLimitMinor: null, safetyBufferMinor: 0, ...overrides,
});

function dailyRows(count, amountMinor = 1000, prefix = 'current', startDay = 1) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`, date: `2026-10-${String(index + startDay).padStart(2, '0')}`,
    merchant: `Cafe ${index}`, amountMinor, category: 'Dining', isDiscretionary: true,
  }));
}

test('sample basic projection uses current balance plus future income minus planned expenses, without subtracting past transactions again', () => {
  const sample = createSampleScenario('2026-10-25');
  const result = calculateForecast(sample);
  assert.equal(result.basicProjectionMinor, 650000 + 200000 - 840000);
  assert.equal(result.status, 'POTENTIAL_SHORTFALL');
  assert.equal(result.projectionBasis, 'history');
  assert.ok(result.adjustedProjectionMinor < result.basicProjectionMinor);
  assert.ok(result.eligibleHistoryDays >= 14);
});

test('missing current balance or unconfirmed future items return Insufficient Data', () => {
  const result = calculateForecast({ asOfDate: '2026-10-20', expectedIncome: undefined, expectedExpenses: undefined });
  assert.equal(result.status, 'INSUFFICIENT_DATA');
  assert.match(result.statusReason, /current available balance/);
  assert.match(result.statusReason, /expected income/);
});

test('a zero projection is caution and an above-buffer projection is on track', () => {
  const base = baseInput({ currentBalanceMinor: 10000, expectedExpenses: [{ id: 'bill', label: 'Bill', amountMinor: 10000 }] });
  assert.equal(calculateForecast(base).status, 'CAUTION');
  assert.equal(calculateForecast({ ...base, expectedExpenses: [{ id: 'bill', label: 'Bill', amountMinor: 9000 }] }).status, 'ON_TRACK');
  assert.equal(calculateForecast({ ...base, currentBalanceMinor: 20000, expectedExpenses: [{ id: 'bill', label: 'Bill', amountMinor: 9000 }], safetyBufferMinor: 12000 }).status, 'CAUTION');
});

test('history estimate starts at 14 distinct dated days; below that it stays off unless user enters a daily estimate', () => {
  const rows14 = dailyRows(14, 1000);
  const with14 = calculateForecast(baseInput({ asOfDate: '2026-10-20', transactions: rows14 }));
  assert.equal(with14.estimateSource, 'history');
  assert.equal(with14.additionalSpendEstimateMinor, 11000); // average 1000 x 11 remaining days
  const with13 = calculateForecast(baseInput({ asOfDate: '2026-10-20', transactions: rows14.slice(0, 13) }));
  assert.equal(with13.additionalSpendEstimateMinor, null);
  assert.match(with13.estimateMessage, /Not enough spending history/);
  const manual = calculateForecast(baseInput({ asOfDate: '2026-10-20', transactions: rows14.slice(0, 13), manualDailyDiscretionaryEstimateMinor: 250 }));
  assert.equal(manual.estimateSource, 'manual');
  assert.equal(manual.additionalSpendEstimateMinor, 2750);
});

test('category totals, supported month trends, unusual transactions, and recurring charges are calculated from transaction history', () => {
  const current = dailyRows(14, 2000, 'current');
  const prior = Array.from({ length: 14 }, (_, index) => ({ id: `prior-${index}`, date: `2026-09-${String(index + 1).padStart(2, '0')}`, merchant: `Cafe ${index}`, amountMinor: 1000, category: 'Dining', isDiscretionary: true }));
  current.push({ id: 'spike', date: '2026-10-19', merchant: 'Big Cafe', amountMinor: 12000, category: 'Dining', isDiscretionary: true });
  current.push({ id: 'subscription-current', date: '2026-10-05', merchant: 'StreamBox', amountMinor: 5000, category: 'Subscriptions', isDiscretionary: true });
  prior.push({ id: 'subscription-prior', date: '2026-09-05', merchant: 'StreamBox', amountMinor: 5100, category: 'Subscriptions', isDiscretionary: true });
  const result = calculateForecast(baseInput({ asOfDate: '2026-10-20', transactions: [...current, ...prior] }));
  assert.ok(result.categoryTotals.some((item) => item.name === 'Dining'));
  assert.ok(result.patternFindings.some((item) => item.type === 'category-increase' && item.category === 'Dining'));
  assert.ok(result.patternFindings.some((item) => item.type === 'unusual-spend' && item.transactionId === 'spike'));
  assert.ok(result.potentialRecurring.some((item) => item.merchant === 'StreamBox'));
});

test('goal plans and what-if reductions are numeric, hypothetical, and do not mutate the real goal', () => {
  const goal = { id: 'goal-1', name: 'Laptop', targetMinor: 100000, savedMinor: 20000, deadline: '2026-12-20' };
  const input = baseInput({ currentBalanceMinor: 40000, expectedExpenses: [{ id: 'dining', label: 'Dining plan', amountMinor: 10000, category: 'Dining' }], goals: [goal] });
  const baseline = calculateForecast(input);
  const result = calculateForecast({ ...input, whatIf: { expenseId: 'dining', adjustedAmountMinor: 6000 } });
  assert.equal(result.whatIfResult.savedMinor, 4000);
  assert.equal(result.whatIfResult.afterProjectionMinor - result.whatIfResult.beforeProjectionMinor, 4000);
  assert.equal(result.goalProgress[0].savedMinor, 20000);
  assert.equal(input.goals[0].savedMinor, 20000);
  assert.equal(result.whatIfResult.hypotheticalGoals[0].savedMinor, 24000);
  assert.ok(baseline.goalProgress[0].requiredMonthlyMinor > 0);
});

test('invalid amounts and missing required shape are rejected', () => {
  assert.ok(validateForecastInput({ currentBalanceMinor: -1 }).length > 0);
  assert.throws(() => calculateForecast({ currentBalanceMinor: 100 }), /invalid/);
});
