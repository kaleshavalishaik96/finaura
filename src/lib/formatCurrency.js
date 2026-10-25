export function formatCurrency(amountMinor, currencyCode = 'INR') {
  if (amountMinor === null || amountMinor === undefined || !Number.isFinite(amountMinor)) return 'Not available';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amountMinor / 100);
}
