const isoDate = (date) => date.toISOString().slice(0, 10);
const shiftDate = (date, amount) => {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + amount);
  return isoDate(shifted);
};
const amountList = [26000, 31000, 22000, 35000, 18000, 27000];

export function createSampleScenario(asOfDate = new Date().toISOString().slice(0, 10)) {
  const asOf = new Date(`${asOfDate}T00:00:00Z`);
  const [year, month, day] = asOfDate.split('-').map(Number);
  const transactions = [];
  const currentStart = isoDate(new Date(Date.UTC(year, month - 1, 1)));
  const currentCoveredDays = Math.max(0, day - 1);
  for (let offset = 0; offset < currentCoveredDays; offset += 1) {
    const date = shiftDate(currentStart, offset);
    const category = offset % 5 === 0 ? 'Groceries' : offset % 3 === 0 ? 'Transport' : 'Dining';
    const amountMinor = category === 'Dining' ? Math.round(amountList[offset % amountList.length] * 1.25) : category === 'Groceries' ? 48000 + (offset % 4) * 2500 : 12000 + (offset % 3) * 1800;
    transactions.push({ id: `sample-current-${offset}`, date, merchant: category === 'Dining' ? `Campus Cafe ${offset % 3}` : category === 'Groceries' ? 'Fresh Market' : 'City Transit', description: `${category} purchase`, amountMinor, category, isDiscretionary: category !== 'Groceries' });
  }

  const priorStart = isoDate(new Date(Date.UTC(year, month - 2, 1)));
  const priorWindowDays = Math.min(28, day - 1);
  for (let offset = 0; offset < priorWindowDays; offset += 1) {
    const date = shiftDate(priorStart, offset);
    const category = offset % 5 === 0 ? 'Groceries' : offset % 3 === 0 ? 'Transport' : 'Dining';
    const amountMinor = category === 'Dining' ? amountList[offset % amountList.length] : category === 'Groceries' ? 44000 + (offset % 4) * 2000 : 11000 + (offset % 3) * 1700;
    transactions.push({ id: `sample-prior-${offset}`, date, merchant: category === 'Dining' ? `Campus Cafe ${offset % 3}` : category === 'Groceries' ? 'Fresh Market' : 'City Transit', description: `${category} purchase`, amountMinor, category, isDiscretionary: category !== 'Groceries' });
  }

  const subscriptionDate = shiftDate(asOfDate, -18);
  transactions.push({ id: 'sample-stream-1', date: shiftDate(subscriptionDate, -30), merchant: 'StreamBox', description: 'StreamBox monthly plan', amountMinor: 49900, category: 'Subscriptions', isDiscretionary: true });
  transactions.push({ id: 'sample-stream-2', date: subscriptionDate, merchant: 'StreamBox', description: 'StreamBox monthly plan', amountMinor: 49900, category: 'Subscriptions', isDiscretionary: true });
  transactions.push({ id: 'sample-large-purchase', date: shiftDate(asOfDate, -2), merchant: 'Campus Store', description: 'Course supplies', amountMinor: 185000, category: 'Shopping', isDiscretionary: true });
  for (let offset = 3; offset < 12; offset += 2) transactions.push({ id: `sample-shopping-${offset}`, date: shiftDate(asOfDate, -offset), merchant: 'Campus Store', description: 'Course supplies', amountMinor: 42000 + offset * 100, category: 'Shopping', isDiscretionary: true });

  const futureMonth = String(month).padStart(2, '0');
  const endDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const incomeDay = day < endDate ? Math.min(endDate, Math.max(28, day + 1)) : 0;
  const incomeDate = incomeDay ? `${year}-${futureMonth}-${String(incomeDay).padStart(2, '0')}` : asOfDate;

  return {
    sampleLabel: 'Fictional sample data',
    asOfDate,
    currencyCode: 'INR',
    monthlyIncomeMinor: 1800000,
    currentBalanceMinor: 650000,
    expectedIncome: incomeDay ? [{ id: 'allowance', date: incomeDate, amountMinor: 200000 }] : [],
    expectedExpenses: [
      { id: 'rent', label: 'Room rent', category: 'Housing', date: incomeDate, amountMinor: 600000 },
      { id: 'utilities', label: 'Phone and utilities', category: 'Bills', date: incomeDate, amountMinor: 180000 },
      { id: 'dining-plan', label: 'Dining for the rest of the month', category: 'Dining', date: `${year}-${futureMonth}-${String(endDate).padStart(2, '0')}`, amountMinor: 60000, isDiscretionary: true },
    ],
    monthlyLimitMinor: 1600000,
    safetyBufferMinor: 100000,
    transactions,
    totalSpendingSoFarMinor: null,
    manualDailyDiscretionaryEstimateMinor: null,
    goals: [
      { id: 'emergency', name: 'Emergency fund', targetMinor: 1000000, savedMinor: 300000, deadline: shiftDate(asOfDate, 120) },
      { id: 'laptop', name: 'New laptop', targetMinor: 600000, savedMinor: 100000, deadline: shiftDate(asOfDate, 210) },
    ],
    whatIf: null,
  };
}
