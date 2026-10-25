export const toMinor = (value) => {
  if (value === '' || value == null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
};

export const toRupees = (minor) => minor == null ? '' : (minor / 100).toFixed(2).replace(/\.00$/, '');

export function suggestCategory(description = '') {
  const text = description.toLowerCase();
  const rules = [
    ['Dining', /cafe|coffee|restaurant|food|dining|swiggy|zomato|canteen|pizza|lunch|dinner/],
    ['Groceries', /grocery|groceries|market|vegetable|fruit|supermarket|bigbasket|zepto|blinkit/],
    ['Transport', /uber|ola|metro|bus|train|fuel|petrol|cab|transit/],
    ['Subscriptions', /netflix|spotify|stream|subscription|prime video|youtube premium/],
    ['Shopping', /shop|store|amazon|flipkart|clothes|books|supplies/],
    ['Bills', /bill|electric|internet|phone|water|utility/],
    ['Health', /pharmacy|medical|doctor|health|clinic/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'Uncategorized';
}
