import Papa from 'papaparse';
import { suggestCategory, toMinor } from './financeInput.js';

export const CSV_HEADERS = ['date', 'merchant', 'amount', 'category', 'isDiscretionary'];
const isRealDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export function normalizeParsedTransactions(parsed, asOfDate) {
  const header = parsed.meta?.fields || [];
  const missing = CSV_HEADERS.map((name) => name.toLowerCase()).filter((name) => !header.includes(name));
  if (missing.length) throw new Error(`CSV needs these columns: ${CSV_HEADERS.join(', ')}. Missing: ${missing.join(', ')}.`);
  if (parsed.errors?.length) throw new Error(`CSV could not be read: ${parsed.errors[0].message}`);
  const earliest = new Date(`${asOfDate}T00:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - 90);
  const earliestDate = earliest.toISOString().slice(0, 10);
  const rows = parsed.data.map((row, index) => {
    const date = row.date?.trim();
    const merchant = row.merchant?.trim();
    const amountMinor = toMinor(row.amount?.trim());
    if (!isRealDate(date) || date < earliestDate || date > asOfDate) throw new Error(`Row ${index + 2}: date must be within the last 90 days and not in the future.`);
    if (!merchant) throw new Error(`Row ${index + 2}: merchant or description is required.`);
    if (amountMinor == null || amountMinor <= 0) throw new Error(`Row ${index + 2}: amount must be greater than zero.`);
    const category = row.category?.trim() || suggestCategory(merchant);
    const discretionary = row.isdiscretionary?.trim().toLowerCase();
    if (discretionary && !['true', 'false', 'yes', 'no'].includes(discretionary)) throw new Error(`Row ${index + 2}: isDiscretionary must be true or false.`);
    return { id: `csv-${Date.now()}-${index}`, date, merchant, description: merchant, amountMinor, category, isDiscretionary: !['false', 'no'].includes(discretionary) };
  });
  if (!rows.length) throw new Error('This CSV has no transaction rows.');
  return rows;
}

export function parseTransactionText(text, asOfDate) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (value) => value.trim().toLowerCase() });
  return normalizeParsedTransactions(parsed, asOfDate);
}

export async function parseTransactionCsv(file, asOfDate) {
  return parseTransactionText(await file.text(), asOfDate);
}

export function downloadSampleCsv(transactions) {
  const csv = Papa.unparse({ fields: CSV_HEADERS, data: transactions.map((row) => [row.date, row.merchant || row.description || 'Expense', (row.amountMinor / 100).toFixed(2), row.category || 'Uncategorized', row.isDiscretionary === false ? 'false' : 'true']) });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'finaura-sample-transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
}
