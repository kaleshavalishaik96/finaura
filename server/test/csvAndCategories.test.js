import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionText } from '../../src/lib/csv.js';
import { suggestCategory } from '../../src/lib/financeInput.js';

test('CSV reader imports valid dated rows and fills an editable category suggestion', () => {
  const text = 'date,merchant,amount,category,isDiscretionary\n2026-10-10,"Campus cafe, north",125.50,,true';
  const [row] = parseTransactionText(text, '2026-10-25');
  assert.equal(row.merchant, 'Campus cafe, north');
  assert.equal(row.amountMinor, 12550);
  assert.equal(row.category, 'Dining');
  assert.equal(row.isDiscretionary, true);
});

test('invalid CSV rows reject the whole import instead of returning partial transactions', () => {
  const text = 'date,merchant,amount,category,isDiscretionary\n2026-10-10,Cafe,10,Dining,true\n2026-06-01,Old Cafe,20,Dining,true';
  assert.throws(() => parseTransactionText(text, '2026-10-25'), /last 90 days/);
});

test('category suggestions leave unmatched merchants Uncategorized', () => {
  assert.equal(suggestCategory('Ola ride'), 'Transport');
  assert.equal(suggestCategory('unknown kiosk'), 'Uncategorized');
});
