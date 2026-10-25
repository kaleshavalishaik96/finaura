const isMoney = (value) => Number.isSafeInteger(value) && value >= 0;
const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const sum = (items, key = 'amountMinor') => items.reduce((total, item) => total + item[key], 0);

export function validateForecastInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Request body must be an object.'];
  if (!validDate(input.asOfDate)) return ['Enter a valid as-of date.'];
  if (input.currentBalanceMinor != null && !isMoney(input.currentBalanceMinor)) errors.push('Current balance must be a non-negative amount.');
  for (const [key, label] of [['expectedIncome', 'Expected income'], ['expectedExpenses', 'Expected expenses'], ['transactions', 'Transactions'], ['goals', 'Savings goals']]) {
    if (input[key] != null && !Array.isArray(input[key])) errors.push(`${label} must be a list.`);
  }
  for (const entry of input.expectedIncome ?? []) {
    if (!entry || !validDate(entry.date) || entry.date < input.asOfDate || entry.date.slice(0, 7) !== input.asOfDate.slice(0, 7) || !isMoney(entry.amountMinor)) { errors.push('Each expected income needs a date before month-end and a non-negative amount.'); break; }
  }
  for (const entry of input.expectedExpenses ?? []) {
    if (!entry || typeof entry.id !== 'string' || typeof entry.label !== 'string' || !isMoney(entry.amountMinor) || (entry.date != null && (!validDate(entry.date) || entry.date < input.asOfDate || entry.date.slice(0, 7) !== input.asOfDate.slice(0, 7)))) { errors.push('Each planned expense needs an id, name, non-negative amount, and a remaining date in this month.'); break; }
  }
  for (const row of input.transactions ?? []) {
    if (!row || !validDate(row.date) || !isMoney(row.amountMinor)) { errors.push('Each transaction needs a valid date and non-negative amount.'); break; }
  }
  for (const value of ['monthlyIncomeMinor', 'monthlyLimitMinor', 'safetyBufferMinor', 'totalSpendingSoFarMinor', 'manualDailyDiscretionaryEstimateMinor']) {
    if (input[value] != null && !isMoney(input[value])) errors.push(`${value} must be a non-negative amount.`);
  }
  for (const goal of input.goals ?? (input.goal ? [input.goal] : [])) {
    if (!goal || typeof goal.name !== 'string' || !isMoney(goal.targetMinor) || !isMoney(goal.savedMinor ?? 0) || !validDate(goal.deadline)) {
      errors.push('Each savings goal needs a name, target, saved amount, and valid deadline.'); break;
    }
  }
  return errors;
}

function monthParts(date) {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function dateInMonth(date, year, month) {
  const parts = monthParts(date);
  return parts.year === year && parts.month === month;
}

function monthWindow(asOfDate, previous = false) {
  const { year, month, day } = monthParts(asOfDate);
  const date = new Date(Date.UTC(year, month - 1 - (previous ? 1 : 0), 1));
  const startYear = date.getUTCFullYear();
  const startMonth = date.getUTCMonth() + 1;
  const days = new Date(Date.UTC(startYear, startMonth, 0)).getUTCDate();
  const endDay = Math.min(day, days);
  const prefix = `${startYear}-${String(startMonth).padStart(2, '0')}-`;
  return { year: startYear, month: startMonth, endDay, daysInMonth: days, start: `${prefix}01`, end: `${prefix}${String(endDay).padStart(2, '0')}` };
}

function coveredDays(rows) {
  return new Set(rows.map((row) => row.date)).size;
}

function groupedTotals(rows, key) {
  const totals = {};
  for (const row of rows) {
    const group = row[key] || 'Uncategorized';
    totals[group] = (totals[group] || 0) + row.amountMinor;
  }
  return Object.entries(totals).map(([name, amountMinor]) => ({ name, amountMinor })).sort((a, b) => b.amountMinor - a.amountMinor);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function normalizedMerchant(row) {
  return (row.merchant || row.description || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function analyzePatterns(transactions, asOfDate) {
  const current = monthWindow(asOfDate);
  const prior = monthWindow(asOfDate, true);
  const currentRows = transactions.filter((row) => dateInMonth(row.date, current.year, current.month) && row.date <= asOfDate);
  const priorRows = transactions.filter((row) => dateInMonth(row.date, prior.year, prior.month) && Number(row.date.slice(8, 10)) <= prior.endDay);
  const trendFindings = [];
  if (coveredDays(currentRows) >= 14 && coveredDays(priorRows) >= 14) {
    const currentTotals = Object.fromEntries(groupedTotals(currentRows, 'category').map((row) => [row.name, row.amountMinor]));
    const priorTotals = Object.fromEntries(groupedTotals(priorRows, 'category').map((row) => [row.name, row.amountMinor]));
    for (const [category, amountMinor] of Object.entries(currentTotals)) {
      const previousMinor = priorTotals[category] || 0;
      if (previousMinor > 0 && amountMinor >= previousMinor * 1.25) trendFindings.push({ type: 'category-increase', category, currentMinor: amountMinor, previousMinor, increasePercent: Math.round((amountMinor / previousMinor - 1) * 100) });
    }
  }

  const anomalies = [];
  const earliestDate = new Date(`${asOfDate}T00:00:00Z`);
  earliestDate.setUTCDate(earliestDate.getUTCDate() - 90);
  const recentRows = transactions.filter((row) => row.date <= asOfDate && row.date >= earliestDate.toISOString().slice(0, 10));
  for (const row of recentRows) {
    const priorAmounts = recentRows.filter((other) => other !== row && other.category === row.category && other.date < row.date).map((other) => other.amountMinor);
    if (priorAmounts.length >= 5) {
      const categoryMedianMinor = median(priorAmounts);
      if (row.amountMinor > categoryMedianMinor * 2) anomalies.push({ type: 'unusual-spend', transactionId: row.id, merchant: row.merchant || row.description || 'Expense', category: row.category || 'Uncategorized', amountMinor: row.amountMinor, categoryMedianMinor });
    }
  }

  const merchants = new Map();
  for (const row of recentRows) {
    const merchant = normalizedMerchant(row);
    if (merchant.length < 2) continue;
    merchants.set(merchant, [...(merchants.get(merchant) || []), row]);
  }
  const recurring = [];
  for (const rows of merchants.values()) {
    rows.sort((a, b) => a.date.localeCompare(b.date));
    for (let index = 1; index < rows.length; index += 1) {
      const previousRow = rows[index - 1];
      const currentRow = rows[index];
      const interval = (Date.parse(`${currentRow.date}T00:00:00Z`) - Date.parse(`${previousRow.date}T00:00:00Z`)) / 86400000;
      const relativeDifference = Math.abs(currentRow.amountMinor - previousRow.amountMinor) / Math.max(previousRow.amountMinor, currentRow.amountMinor, 1);
      if (interval >= 25 && interval <= 35 && relativeDifference <= 0.2) {
        recurring.push({ merchant: currentRow.merchant || currentRow.description, dates: [previousRow.date, currentRow.date], monthlyCostMinor: Math.round((previousRow.amountMinor + currentRow.amountMinor) / 2), label: 'Potential recurring' });
        break;
      }
    }
  }
  return { trends: trendFindings, anomalies, recurring };
}

function analyzeGoals(goals, projectionMinor, safetyBufferMinor, asOfDate) {
  return goals.map((goal) => {
    const remainingMinor = Math.max(0, goal.targetMinor - (goal.savedMinor || 0));
    const overdue = goal.deadline < asOfDate;
    const monthsRemaining = overdue ? 0 : Math.max(1, Math.ceil((Date.parse(`${goal.deadline}T00:00:00Z`) - Date.parse(`${asOfDate}T00:00:00Z`)) / (30.4375 * 86400000)));
    const requiredMonthlyMinor = overdue ? null : Math.ceil(remainingMinor / monthsRemaining);
    const availableMonthlyMinor = Math.max(0, projectionMinor - safetyBufferMinor);
    return {
      id: goal.id, name: goal.name, targetMinor: goal.targetMinor, savedMinor: goal.savedMinor || 0,
      deadline: goal.deadline, remainingMinor,
      progressPercent: goal.targetMinor ? Math.min(100, Math.round((goal.savedMinor || 0) / goal.targetMinor * 100)) : 0,
      monthsRemaining, requiredMonthlyMinor, availableMonthlyMinor,
      overdue, feasible: overdue ? null : requiredMonthlyMinor <= availableMonthlyMinor,
      assumption: 'Future months are assumed to have a similar surplus to this month.',
    };
  });
}

function buildBaseResult(input) {
  const required = [];
  if (input.currentBalanceMinor == null) required.push('current available balance');
  if (!Array.isArray(input.expectedIncome)) required.push('expected income (enter zero if none)');
  if (!Array.isArray(input.expectedExpenses)) required.push('expected remaining expenses (enter zero if none)');
  if (required.length) return {
    status: 'INSUFFICIENT_DATA', statusReason: `Add your ${required.join(' and ')} to calculate a reliable month-end projection.`,
    missingFields: required, basicProjectionMinor: null, adjustedProjectionMinor: null, projectionBasis: 'none',
    expectedIncomeMinor: null, expectedExpensesMinor: null, expensesSoFarMinor: 0, incomeMinor: input.monthlyIncomeMinor ?? null,
    currentBalanceMinor: input.currentBalanceMinor ?? null, remainingBudgetMinor: null, additionalSpendEstimateMinor: null,
    estimateSource: 'none', categoryTotals: [], dailyTotals: [], warnings: [], patternFindings: [], potentialRecurring: [], insights: [], goalProgress: [], savingsPlans: [], whatIfResult: null,
  };

  const expectedIncomeMinor = sum(input.expectedIncome);
  const expectedExpensesMinor = sum(input.expectedExpenses);
  const basicProjectionMinor = input.currentBalanceMinor + expectedIncomeMinor - expectedExpensesMinor;
  const transactions = input.transactions || [];
  const { year, month, day } = monthParts(input.asOfDate);
  const currentMonthRows = transactions.filter((row) => dateInMonth(row.date, year, month) && row.date <= input.asOfDate);
  const eligibleRows = currentMonthRows.filter((row) => row.isDiscretionary !== false);
  const historyDays = coveredDays(eligibleRows);
  const remainingDays = new Date(Date.UTC(year, month, 0)).getUTCDate() - day;
  let additionalSpendEstimateMinor = null;
  let estimateSource = 'none';
  let estimateMessage = 'Not enough spending history to estimate additional spending';
  if (historyDays >= 14) {
    const projectedDailyDiscretionaryMinor = remainingDays > 0 ? Math.round(sum(eligibleRows) / historyDays * remainingDays) : 0;
    const knownPlannedDiscretionaryMinor = (input.expectedExpenses || []).filter((row) => row.isDiscretionary === true).reduce((total, row) => total + row.amountMinor, 0);
    additionalSpendEstimateMinor = Math.max(0, projectedDailyDiscretionaryMinor - knownPlannedDiscretionaryMinor);
    estimateSource = 'history';
    estimateMessage = `${historyDays} days of eligible dated spending were used to estimate additional unplanned spending over ${remainingDays} remaining days. Known planned discretionary expenses were subtracted from that estimate to avoid overlap.`;
  } else if (isMoney(input.manualDailyDiscretionaryEstimateMinor)) {
    additionalSpendEstimateMinor = input.manualDailyDiscretionaryEstimateMinor * remainingDays;
    estimateSource = 'manual';
    estimateMessage = `Your optional daily estimate was multiplied by ${remainingDays} remaining days.`;
  }
  const adjustedProjectionMinor = basicProjectionMinor - (additionalSpendEstimateMinor || 0);
  const projectionBasis = estimateSource === 'none' ? 'basic' : estimateSource;
  const monthlyLimitMinor = isMoney(input.monthlyLimitMinor) ? input.monthlyLimitMinor : null;
  const expensesSoFarMinor = transactions.length ? sum(currentMonthRows) : (input.totalSpendingSoFarMinor || 0);
  const remainingBudgetMinor = monthlyLimitMinor == null ? null : monthlyLimitMinor - expensesSoFarMinor;
  const safetyBufferMinor = isMoney(input.safetyBufferMinor) ? input.safetyBufferMinor : 0;
  const statusProjection = adjustedProjectionMinor;
  let status; let statusReason;
  if (statusProjection < 0) {
    status = 'POTENTIAL_SHORTFALL';
    statusReason = `Your ${projectionBasis === 'basic' ? 'basic' : `${projectionBasis}-adjusted`} projection falls below zero by ${formatMinor(-statusProjection, input.currencyCode)}.${estimateSource === 'none' ? ` ${estimateMessage}.` : ''}`;
  } else if (statusProjection === 0 || statusProjection < safetyBufferMinor || (remainingBudgetMinor != null && remainingBudgetMinor < 0)) {
    status = 'CAUTION';
    statusReason = remainingBudgetMinor != null && remainingBudgetMinor < 0
      ? `You are ${formatMinor(-remainingBudgetMinor, input.currencyCode)} over your monthly spending limit.`
      : `Your projected balance is below the ${formatMinor(safetyBufferMinor, input.currencyCode)} safety buffer.`;
  } else {
    status = 'ON_TRACK'; statusReason = `Your projected balance stays above the ${formatMinor(safetyBufferMinor, input.currencyCode)} safety buffer.`;
  }
  const categories = groupedTotals(currentMonthRows, 'category');
  const dailyTotals = groupedTotals(currentMonthRows, 'date').map(({ name, amountMinor }) => ({ date: name, amountMinor })).sort((a, b) => a.date.localeCompare(b.date));
  const patterns = analyzePatterns(transactions, input.asOfDate);
  const goals = input.goals || (input.goal ? [input.goal] : []);
  const goalProgress = analyzeGoals(goals, statusProjection, safetyBufferMinor, input.asOfDate);
  const warnings = [];
  if (status === 'POTENTIAL_SHORTFALL') warnings.push({ title: 'Possible month-end shortfall', reason: statusReason, action: 'Review flexible planned expenses and delay a nonessential purchase if you can.' });
  else if (status === 'CAUTION') warnings.push({ title: 'Your buffer may be tight', reason: statusReason, action: 'Check upcoming bills and pause one flexible expense until your next income arrives.' });
  for (const row of categories.slice(0, 2)) warnings.push({ title: `${row.name} is a top spending category`, reason: `${row.name} accounts for ${formatMinor(row.amountMinor, input.currencyCode)} of this month’s recorded expenses.`, action: `Review upcoming ${row.name.toLowerCase()} purchases for one you can reduce.` });
  const insights = [];
  if (status !== 'ON_TRACK') insights.push({ title: 'Protect your remaining balance', reason: statusReason, action: 'Start with a flexible expense you have not committed to yet.' });
  for (const trend of patterns.trends) insights.push({ title: `${trend.category} spending is up ${trend.increasePercent}%`, reason: `This period: ${formatMinor(trend.currentMinor, input.currencyCode)}; same period last month: ${formatMinor(trend.previousMinor, input.currencyCode)}.`, action: `Set a smaller ${trend.category.toLowerCase()} limit for the rest of this month.` });
  for (const item of patterns.anomalies.slice(0, 2)) insights.push({ title: `Unusually large ${item.category.toLowerCase()} purchase`, reason: `${item.merchant} was ${formatMinor(item.amountMinor, input.currencyCode)}; the category median was ${formatMinor(item.categoryMedianMinor, input.currencyCode)} across at least five earlier purchases.`, action: 'Check whether this was a one-time purchase before changing your monthly plan.' });
  const whatIfResult = input.whatIf ? calculateWhatIf(input, input.whatIf, { basicProjectionMinor, adjustedProjectionMinor, projectionBasis, statusProjection, goals, safetyBufferMinor }) : null;
  return {
    status, statusReason, missingFields: [], basicProjectionMinor, adjustedProjectionMinor, projectionBasis,
    expectedIncomeMinor, expectedExpensesMinor, incomeMinor: input.monthlyIncomeMinor ?? expectedIncomeMinor,
    expensesSoFarMinor, currentBalanceMinor: input.currentBalanceMinor, remainingBudgetMinor,
    additionalSpendEstimateMinor, estimateSource, estimateMessage, eligibleHistoryDays: historyDays, remainingDays,
    categoryTotals: categories, dailyTotals, warnings, patternFindings: patterns.trends.concat(patterns.anomalies),
    potentialRecurring: patterns.recurring, insights, goalProgress, savingsPlans: goalProgress, whatIfResult,
  };
}

function calculateWhatIf(input, whatIf, current) {
  const original = input.expectedExpenses.find((expense) => expense.id === whatIf.expenseId);
  if (!original || !isMoney(whatIf.adjustedAmountMinor) || whatIf.adjustedAmountMinor > original.amountMinor) return { valid: false, reason: 'Choose a planned expense and a lower amount.' };
  const savedMinor = original.amountMinor - whatIf.adjustedAmountMinor;
  const afterBasic = current.basicProjectionMinor + savedMinor;
  const afterAdjusted = current.adjustedProjectionMinor + savedMinor;
  return {
    valid: true, expenseId: original.id, label: original.label, originalAmountMinor: original.amountMinor,
    adjustedAmountMinor: whatIf.adjustedAmountMinor, savedMinor,
    beforeProjectionMinor: current.statusProjection, afterProjectionMinor: afterAdjusted,
    beforeBasicProjectionMinor: current.basicProjectionMinor, afterBasicProjectionMinor: afterBasic,
    hypotheticalGoals: current.goals.map((goal) => ({ id: goal.id, name: goal.name, savedMinor: Math.min(goal.targetMinor, (goal.savedMinor || 0) + savedMinor) })),
    note: 'This is a what-if only. Your actual planned expense and goal remain unchanged.',
  };
}

export function calculateForecast(input) {
  const errors = validateForecastInput(input);
  if (errors.length) {
    const error = new Error('Some financial information is invalid.');
    error.details = errors;
    throw error;
  }
  return buildBaseResult(input);
}

export function calculateBasicForecast(input) {
  return calculateForecast(input);
}

export function formatMinor(amountMinor, currencyCode = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode || 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amountMinor / 100);
}
