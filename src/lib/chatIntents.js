import { formatCurrency } from './formatCurrency.js';

export function answerFinanceQuestion(question, scenario, forecast) {
  const text = question.toLowerCase();
  if (!forecast || forecast.status === 'INSUFFICIENT_DATA') {
    return `I need your current available balance, expected income, and expected remaining expenses before I can answer that reliably. ${forecast?.statusReason || ''}`.trim();
  }
  const whatIfMatch = text.match(/(?:what(?: happens)? if(?: i)?|if i)\s+(?:reduce|cut)\s+(?:my\s+)?([a-z]+)(?:\s+expenses?)?(?:\s+by\s+)?(\d+(?:\.\d+)?)%/);
  if (whatIfMatch) {
    const category = whatIfMatch[1].replace(/s$/, '').toLowerCase();
    const percent = Number(whatIfMatch[2]);
    const planned = (scenario.expectedExpenses || []).filter((item) => item.category?.toLowerCase().includes(category));
    if (!planned.length) return `I do not see a planned remaining ${category} expense. Past purchases are already reflected in your current balance, so reducing them would not change this month’s projection. Add an upcoming expense in that category to calculate a what-if.`;
    const plannedMinor = planned.reduce((total, item) => total + item.amountMinor, 0);
    const savedMinor = Math.round(plannedMinor * percent / 100);
    return `Reducing your planned ${category} expenses by ${percent}% would lower those upcoming costs by ${formatCurrency(savedMinor)} and raise the projected month-end balance to ${formatCurrency(forecast.adjustedProjectionMinor + savedMinor)}. This is a preview; your actual plan and savings goals are unchanged.`;
  }
  if (/project|end of (the )?month|month.?end|shortfall|negative|run out|enough money|afford|cover.*remaining expenses|last (?:until |through )?(?:this month|the month)/.test(text)) {
    return `Your ${forecast.projectionBasis === 'basic' ? 'basic' : `${forecast.projectionBasis}-adjusted`} month-end balance is ${formatCurrency(forecast.adjustedProjectionMinor)}. ${forecast.statusReason}`;
  }
  if (/category|spend(ing)? (the )?most|where.*spend|reduce/.test(text)) {
    const top = forecast.categoryTotals[0];
    if (!top) return 'There is not enough transaction history to compare your spending categories yet.';
    return `${top.name} is your largest recorded category so far at ${formatCurrency(top.amountMinor)}. Review one upcoming ${top.name.toLowerCase()} purchase you could reduce or delay.`;
  }
  if (/budget|limit|left to spend|remaining budget/.test(text)) {
    if (forecast.remainingBudgetMinor == null) return 'You have not set a monthly spending limit, so I cannot calculate how much budget remains.';
    return `You have ${formatCurrency(forecast.remainingBudgetMinor)} of your monthly spending limit left, based on recorded expenses so far.`;
  }
  if (/subscription|recurr|repeated charge/.test(text)) {
    const item = forecast.potentialRecurring[0];
    return item ? `${item.merchant} looks like a potential recurring charge of about ${formatCurrency(item.monthlyCostMinor)} per month. This is a pattern match, not a confirmed subscription.` : 'I do not have enough similar dated charges to flag a potential recurring payment yet.';
  }
  if (/goal|save|savings/.test(text)) {
    const goal = forecast.savingsPlans[0];
    return goal ? `${goal.name} needs about ${formatCurrency(goal.requiredMonthlyMinor)} per month. Your estimated monthly surplus above your buffer is ${formatCurrency(goal.availableMonthlyMinor)}. ${goal.feasible ? 'That fits the current plan assumption.' : 'That is above the current plan estimate, so consider a longer deadline or a smaller target.'}` : 'Add a savings goal with a target and deadline, and I can estimate a monthly contribution.';
  }
  return 'I can explain your month-end projection, spending categories, budget left, potential recurring charges, or savings goals. Ask me about one of those using your current dashboard data.';
}
