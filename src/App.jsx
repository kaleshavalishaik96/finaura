import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { createSampleScenario } from '../shared/sampleScenario.js';
import { answerFinanceQuestion } from './lib/chatIntents.js';
import { downloadSampleCsv, parseTransactionCsv } from './lib/csv.js';
import { suggestCategory, toMinor, toRupees } from './lib/financeInput.js';
import { formatCurrency } from './lib/formatCurrency.js';
import { getForecast } from './lib/api.js';

const SpendingCharts = lazy(() => import('./components/SpendingCharts.jsx'));

const categories = ['Dining', 'Groceries', 'Transport', 'Shopping', 'Bills', 'Subscriptions', 'Health', 'Housing', 'Education', 'Other', 'Uncategorized'];
const emptyScenario = () => ({ asOfDate: new Date().toISOString().slice(0, 10), currencyCode: 'INR', currentBalanceMinor: null, monthlyIncomeMinor: null, expectedIncome: undefined, expectedExpenses: undefined, monthlyLimitMinor: null, safetyBufferMinor: 0, transactions: [], totalSpendingSoFarMinor: null, manualDailyDiscretionaryEstimateMinor: null, goals: [], whatIf: null });

function SectionTitle({ eyebrow, title, note, id }) {
  return <div className="section-title"><div><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2></div>{note && <p className="section-note">{note}</p>}</div>;
}

function MetricCard({ title, value, detail, icon, tone }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span className="metric-icon" aria-hidden="true">{icon}</span><span>{detail}</span></div><p>{title}</p><strong>{value}</strong></article>;
}

function PlanInputs({ scenario, onSave, onClose }) {
  const [balance, setBalance] = useState(toRupees(scenario.currentBalanceMinor));
  const [monthlyIncome, setMonthlyIncome] = useState(toRupees(scenario.monthlyIncomeMinor));
  const [income, setIncome] = useState(toRupees(scenario.expectedIncome?.reduce((total, row) => total + row.amountMinor, 0) || 0));
  const [incomeDate, setIncomeDate] = useState(scenario.expectedIncome?.[0]?.date || scenario.asOfDate);
  const [limit, setLimit] = useState(toRupees(scenario.monthlyLimitMinor));
  const [buffer, setBuffer] = useState(toRupees(scenario.safetyBufferMinor));
  const [spent, setSpent] = useState(toRupees(scenario.totalSpendingSoFarMinor));
  const [dailyEstimate, setDailyEstimate] = useState(toRupees(scenario.manualDailyDiscretionaryEstimateMinor));
  const [expenses, setExpenses] = useState(scenario.expectedExpenses || []);
  const [label, setLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Bills');
  const [expenseDate, setExpenseDate] = useState(scenario.asOfDate);
  const [message, setMessage] = useState('');

  function addPlannedExpense() {
    const amountMinor = toMinor(expenseAmount);
    if (!label.trim() || amountMinor == null || amountMinor <= 0 || !expenseDate) { setMessage('Enter a name, date, and amount greater than zero.'); return; }
    setExpenses((current) => [...current, { id: `planned-${Date.now()}`, label: label.trim(), category: expenseCategory, date: expenseDate, amountMinor, isDiscretionary: ['Dining', 'Shopping', 'Other'].includes(expenseCategory) }]);
    setLabel(''); setExpenseAmount(''); setMessage('');
  }

  function submit(event) {
    event.preventDefault();
    if (toMinor(balance) == null || !incomeDate) { setMessage('Enter your current balance and the date to confirm expected income. Use zero if none is expected.'); return; }
    onSave({ currentBalanceMinor: toMinor(balance), monthlyIncomeMinor: toMinor(monthlyIncome), expectedIncome: toMinor(income) > 0 ? [{ id: 'future-income', date: incomeDate, amountMinor: toMinor(income) }] : [], expectedExpenses: expenses, monthlyLimitMinor: toMinor(limit), safetyBufferMinor: toMinor(buffer) ?? 0, totalSpendingSoFarMinor: scenario.transactions?.length ? null : toMinor(spent), manualDailyDiscretionaryEstimateMinor: toMinor(dailyEstimate) });
  }

  return <section className="panel form-panel" aria-labelledby="plan-input-title"><SectionTitle eyebrow="YOUR MONTH" title="Set up your plan" id="plan-input-title" note="Required: current balance, expected income, and planned expenses. Enter zero when none are expected."/><form onSubmit={submit}>
    <div className="form-grid"><label>Current available balance (₹)<input type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} required /></label><label>Monthly income summary (₹)<input type="number" min="0" step="0.01" value={monthlyIncome} onChange={(event) => setMonthlyIncome(event.target.value)} /></label><label>Expected income before month-end (₹)<input type="number" min="0" step="0.01" value={income} onChange={(event) => setIncome(event.target.value)} required /></label><label>Expected income date<input type="date" value={incomeDate} onChange={(event) => setIncomeDate(event.target.value)} required /></label><label>Monthly spending limit (optional)<input type="number" min="0" step="0.01" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="No limit set" /></label><label>Minimum safety buffer (optional)<input type="number" min="0" step="0.01" value={buffer} onChange={(event) => setBuffer(event.target.value)} /></label>{scenario.transactions.length === 0 && <label>Total spending so far (if no transaction history)<input type="number" min="0" step="0.01" value={spent} onChange={(event) => setSpent(event.target.value)} placeholder="Optional" /></label>}<label>Optional daily spending estimate (₹)<input type="number" min="0" step="0.01" value={dailyEstimate} onChange={(event) => setDailyEstimate(event.target.value)} placeholder="Used only when history is under 14 days" /></label></div>
    <div className="planned-editor"><h3>Expected remaining expenses</h3><p>Add known bills and planned purchases. Past spending is not subtracted again from your current balance.</p><div className="inline-form"><label>Expense name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Phone bill" /></label><label>Amount (₹)<input type="number" min="0" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="0.00" /></label><label>Category<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Date<input type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} /></label><button className="button button-soft" type="button" onClick={addPlannedExpense}>Add expense</button></div>
      {expenses.length > 0 && <ul className="planned-list">{expenses.map((item) => <li key={item.id}><span><strong>{item.label}</strong><small>{item.category} · {item.date}</small></span><b>{formatCurrency(item.amountMinor)}</b><button className="icon-button" type="button" aria-label={`Remove ${item.label}`} onClick={() => setExpenses((current) => current.filter((row) => row.id !== item.id))}>×</button></li>)}</ul>}
      {expenses.length === 0 && <p className="empty-inline">No known expenses added. Saving with none means you expect zero additional planned expenses.</p>}
    </div>
    {message && <p className="form-message" role="alert">{message}</p>}<div className="form-actions"><button className="button button-primary" type="submit">Calculate my month</button><button className="button button-quiet" type="button" onClick={onClose}>Close</button></div>
  </form></section>;
}

function TransactionTools({ scenario, setScenario, onError }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(scenario.asOfDate);
  const [category, setCategory] = useState('Uncategorized');
  const [discretionary, setDiscretionary] = useState(true);
  const [editing, setEditing] = useState(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const fileRef = useRef(null);

  function saveTransaction(event) {
    event.preventDefault();
    const amountMinor = toMinor(amount);
    if (!description.trim() || amountMinor == null || amountMinor <= 0 || !date) { onError('Enter a description, valid date, and positive amount for the transaction.'); return; }
    const transaction = { id: editing || `tx-${Date.now()}`, date, merchant: description.trim(), description: description.trim(), amountMinor, category, isDiscretionary: discretionary };
    setScenario((current) => ({ ...current, transactions: editing ? current.transactions.map((row) => row.id === editing ? transaction : row) : [...current.transactions, transaction], totalSpendingSoFarMinor: null }));
    setDescription(''); setAmount(''); setCategory('Uncategorized'); setEditing(null); onError('');
  }

  function editRow(row) {
    setEditing(row.id); setDescription(row.description || row.merchant || ''); setAmount(toRupees(row.amountMinor)); setDate(row.date); setCategory(row.category || 'Uncategorized'); setDiscretionary(row.isDiscretionary !== false);
    document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvBusy(true); onError('');
    try {
      const rows = await parseTransactionCsv(file, scenario.asOfDate);
      setScenario((current) => ({ ...current, transactions: [...current.transactions, ...rows], totalSpendingSoFarMinor: null }));
    } catch (error) { onError(error.message); }
    finally { setCsvBusy(false); event.target.value = ''; }
  }

  const ordered = [...scenario.transactions].sort((a, b) => b.date.localeCompare(a.date));
  return <section id="activity" className="panel" aria-labelledby="activity-title"><SectionTitle eyebrow="SMART EXPENSE ANALYSIS" title="Your transactions" id="activity-title" note={`${scenario.transactions.length} recorded ${scenario.transactions.length === 1 ? 'transaction' : 'transactions'} · session only`}/>
    <form id="transaction-form" className="transaction-form" onSubmit={saveTransaction}><label>Description or merchant<input value={description} onChange={(event) => { setDescription(event.target.value); setCategory(suggestCategory(event.target.value)); }} placeholder="e.g. Campus cafe" required /></label><label>Amount (₹)<input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label><label>Date<input type="date" value={date} max={scenario.asOfDate} onChange={(event) => setDate(event.target.value)} required /></label><label>Category suggestion<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={discretionary} onChange={(event) => setDiscretionary(event.target.checked)} />Flexible / discretionary spending</label><div className="form-actions"><button className="button button-primary" type="submit">{editing ? 'Save changes' : 'Add transaction'}</button>{editing && <button className="button button-quiet" type="button" onClick={() => { setEditing(null); setDescription(''); setAmount(''); }}>Cancel edit</button>}</div></form>
    <div className="csv-tools"><div><strong>Import transaction CSV</strong><span>date, merchant, amount, category, isDiscretionary · up to 90 days · all rows validate before import.</span></div><div className="csv-buttons"><button className="button button-soft" type="button" onClick={() => fileRef.current?.click()} disabled={csvBusy}>{csvBusy ? 'Checking file…' : 'Choose CSV'}</button><button className="button button-quiet" type="button" onClick={() => downloadSampleCsv(createSampleScenario(scenario.asOfDate).transactions)}>Download sample CSV</button></div><input ref={fileRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importFile} aria-label="Choose a transaction CSV file" /></div>
    <div className="transaction-list">{ordered.length ? ordered.map((row) => <article className="transaction-row" key={row.id}><div className="transaction-badge">{(row.category || '?').slice(0, 1)}</div><div className="transaction-name"><strong>{row.merchant || row.description}</strong><span>{row.category || 'Uncategorized'} · {row.date}{row.isDiscretionary === false ? ' · essential' : ''}</span></div><b className="transaction-amount">− {formatCurrency(row.amountMinor)}</b><button className="icon-button" type="button" aria-label={`Edit ${row.merchant || row.description}`} onClick={() => editRow(row)}>Edit</button><button className="icon-button danger" type="button" aria-label={`Delete ${row.merchant || row.description}`} onClick={() => setScenario((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== row.id) }))}>Delete</button></article>) : <div className="empty-inline">No transactions yet. Add one above or import the fictional sample CSV.</div>}</div>
  </section>;
}

function GoalPanel({ scenario, setScenario, forecast }) {
  const [name, setName] = useState(''); const [target, setTarget] = useState(''); const [saved, setSaved] = useState(''); const [deadline, setDeadline] = useState(scenario.asOfDate);
  const [editing, setEditing] = useState(null);
  function submit(event) {
    event.preventDefault();
    const targetMinor = toMinor(target); const savedMinor = toMinor(saved);
    if (!name.trim() || targetMinor == null || targetMinor <= 0 || savedMinor == null || !deadline) return;
    if (!editing && scenario.goals.length >= 3) return;
    const goal = { id: editing || `goal-${Date.now()}`, name: name.trim(), targetMinor, savedMinor, deadline };
    setScenario((current) => ({ ...current, goals: editing ? current.goals.map((item) => item.id === editing ? goal : item) : [...current.goals, goal] }));
    setName(''); setTarget(''); setSaved(''); setEditing(null);
  }
  function startEdit(goal) { setEditing(goal.id); setName(goal.name); setTarget(toRupees(goal.targetMinor)); setSaved(toRupees(goal.savedMinor)); setDeadline(goal.deadline); }
  const goals = forecast?.goalProgress || [];
  return <section id="goals" className="panel" aria-labelledby="goals-title"><SectionTitle eyebrow="PERSONALIZED SAVINGS GOALS" title="Small steps, real progress" id="goals-title" note="Up to three goals · actual saved amounts never change in a what-if scenario"/>
    {goals.length ? <div className="goal-grid">{goals.map((goal) => <article className="goal-card" key={goal.id}><div className="goal-card-top"><span className="goal-icon" aria-hidden="true">✦</span><div><button className="icon-button" type="button" onClick={() => startEdit(goal)}>Edit</button> <button className="icon-button danger" type="button" onClick={() => setScenario((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== goal.id) }))}>Remove</button></div></div><h3>{goal.name}</h3><p className="goal-amount">{formatCurrency(goal.savedMinor)} <span>of {formatCurrency(goal.targetMinor)}</span></p><div className="progress-track" role="progressbar" aria-label={`${goal.name} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={goal.progressPercent}><span style={{ width: `${goal.progressPercent}%` }} /></div><div className="goal-progress-label"><span>{goal.progressPercent}% saved</span><span>{formatCurrency(goal.remainingMinor)} left</span></div><div className="goal-plan"><strong>{goal.overdue ? 'Goal deadline has passed' : `${formatCurrency(goal.requiredMonthlyMinor)} / month needed`}</strong><span>{goal.overdue ? 'Choose a new target date to estimate a plan.' : goal.feasible ? 'Fits this month’s estimated surplus' : 'Above this month’s estimated surplus'}</span><small>{goal.assumption}</small></div></article>)}</div> : <div className="empty-inline">Add a goal to see progress, amount remaining, and an achievable monthly savings estimate.</div>}
    {(scenario.goals.length < 3 || editing) && <form className="goal-form" onSubmit={submit}><label>Goal name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Emergency fund" required /></label><label>Target amount (₹)<input type="number" min="0.01" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} required /></label><label>Already saved (₹)<input type="number" min="0" step="0.01" value={saved} onChange={(event) => setSaved(event.target.value)} required /></label><label>Target date<input type="date" min={scenario.asOfDate} value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label><button className="button button-soft" type="submit">{editing ? 'Save goal changes' : 'Add savings goal'}</button>{editing && <button className="button button-quiet" type="button" onClick={() => { setEditing(null); setName(''); setTarget(''); setSaved(''); }}>Cancel</button>}</form>}
  </section>;
}

function Simulator({ scenario, setScenario, forecast }) {
  const [expenseId, setExpenseId] = useState(scenario.expectedExpenses?.[0]?.id || '');
  const expense = scenario.expectedExpenses?.find((row) => row.id === expenseId);
  const [amount, setAmount] = useState(expense ? toRupees(expense.amountMinor) : '');
  useEffect(() => { if (!scenario.expectedExpenses?.some((row) => row.id === expenseId)) { const first = scenario.expectedExpenses?.[0]; setExpenseId(first?.id || ''); setAmount(first ? toRupees(first.amountMinor) : ''); } }, [scenario.expectedExpenses, expenseId]);
  function choose(id) { const row = scenario.expectedExpenses.find((item) => item.id === id); setExpenseId(id); setAmount(row ? toRupees(row.amountMinor) : ''); setScenario((current) => ({ ...current, whatIf: null })); }
  function simulate(event) { event.preventDefault(); const adjustedAmountMinor = toMinor(amount); if (!expense || adjustedAmountMinor == null || adjustedAmountMinor > expense.amountMinor) return; setScenario((current) => ({ ...current, whatIf: { expenseId, adjustedAmountMinor } })); }
  const result = forecast?.whatIfResult;
  return <section id="simulator" className="panel simulator-panel" aria-labelledby="simulator-title"><SectionTitle eyebrow="WHAT-IF SAVINGS SIMULATOR" title="Try a smaller expense" id="simulator-title" note="Preview the change before updating your real plan."/>
    {scenario.expectedExpenses?.length ? <form className="simulator-form" onSubmit={simulate}><label>Choose a planned expense<select value={expenseId} onChange={(event) => choose(event.target.value)}>{scenario.expectedExpenses.map((row) => <option key={row.id} value={row.id}>{row.label} · {formatCurrency(row.amountMinor)}</option>)}</select></label><label>New amount (₹)<input type="number" min="0" max={(expense?.amountMinor || 0) / 100} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button className="button button-primary" type="submit">Calculate what-if</button>{result?.valid && <button className="button button-quiet" type="button" onClick={() => setScenario((current) => ({ ...current, whatIf: null }))}>Reset</button>}</form> : <div className="empty-inline">Add a planned expense to try a reduction here.</div>}
    {result?.valid && <div className="whatif-result" aria-live="polite"><div><span>Current projection</span><strong>{formatCurrency(result.beforeProjectionMinor)}</strong></div><span className="whatif-arrow" aria-hidden="true">→</span><div><span>After this change</span><strong>{formatCurrency(result.afterProjectionMinor)}</strong></div><div className="whatif-saved"><span>Projected improvement</span><strong>+{formatCurrency(result.savedMinor)}</strong></div><p>{result.note} {result.hypotheticalGoals.length > 0 && `If placed toward ${result.hypotheticalGoals[0].name}, hypothetical progress would be ${formatCurrency(result.hypotheticalGoals[0].savedMinor)}.`}</p></div>}
  </section>;
}

const sampleQuestions = [
  ['negative-projection', 'Why might my projected balance become negative?'],
  ['reduce-category', 'Which spending category could I reduce?'],
  ['reduce-dining-10', 'What happens if I reduce dining expenses by 10%?'],
  ['practical-savings', 'What practical steps could help me save more?'],
];

function Copilot({ mode, scenario, forecast }) {
  const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState(''); const [source, setSource] = useState(''); const [sampleFacts, setSampleFacts] = useState(null); const [lastPreset, setLastPreset] = useState(''); const [busy, setBusy] = useState(false); const [messages, setMessages] = useState([]); const [adultConfirmed, setAdultConfirmed] = useState(false);
  async function askPreset(presetId) {
    setBusy(true); setAnswer(''); setSource(''); setSampleFacts(null); setLastPreset(presetId);
    try { const response = await fetch('/api/sample-explanation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ presetId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setAnswer(data.explanation); setSource(data.source); setSampleFacts(data.facts); }
    catch { setAnswer('Sample explanation is unavailable right now. The figures above remain calculated by Finaura.'); setSource('fallback'); }
    finally { setBusy(false); }
  }
  function askLocal(event) {
    event.preventDefault(); if (!question.trim()) return;
    const reply = answerFinanceQuestion(question, scenario, forecast);
    setMessages((current) => [...current, { question: question.trim(), reply }]); setQuestion('');
  }
  return <section id="copilot" className="panel copilot-panel" aria-labelledby="copilot-title"><SectionTitle eyebrow="ASK FINAURA" title="A money question, answered clearly" id="copilot-title" note="Your personal questions and figures are handled locally; they are never sent to Gemini."/>
    <form className="chat-form" onSubmit={askLocal}><label className="visually-hidden" htmlFor="chat-question">Ask a question about your budget, spending, or goals</label><input id="chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your projection, budget, spending, or goals…" /><button className="button button-primary" type="submit">Ask Finaura</button></form>
    <div className="chat-suggestions"><span>Try:</span>{['Will my money last this month?', 'What category could I reduce?', 'How much budget do I have left?'].map((item) => <button type="button" key={item} onClick={() => setQuestion(item)}>{item}</button>)}</div>
    {messages.length > 0 && <div className="chat-history" aria-live="polite">{messages.slice(-4).map((item, index) => <div className="chat-exchange" key={`${item.question}-${index}`}><p><strong>You</strong>{item.question}</p><p><strong>Finaura</strong>{item.reply}</p></div>)}</div>}
    {mode === 'sample' && <div className="sample-ai-box"><div className="sample-ai-heading"><span className="ai-mark" aria-hidden="true">✦</span><div><strong>Sample-only AI explanations</strong><span>Gemini receives fictional sample data only. Personal data is never sent.</span></div></div>{adultConfirmed ? <div className="preset-grid">{sampleQuestions.map(([id, text]) => <button type="button" key={id} onClick={() => askPreset(id)} disabled={busy}>{text}<span aria-hidden="true">→</span></button>)}</div> : <label className="age-confirm"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} /><span><strong>Confirm you are 18 or older</strong><small>This adult confirmation is required to use Gemini. The sample dashboard works without it.</small></span></label>}{busy && <p className="ai-answer" role="status">Preparing a sample explanation…</p>}{answer && <div className="ai-answer" aria-live="polite"><span>{source === 'gemini' ? 'Gemini explanation' : 'Built-in sample explanation'}</span><p>{answer}</p>{sampleFacts && <div className="sample-facts"><div><span>Calculated projection</span><strong>{formatCurrency(sampleFacts.projectionMinor)}</strong></div><div><span>Status</span><strong>{statusNames[sampleFacts.status] || sampleFacts.status}</strong></div>{lastPreset === 'reduce-category' && <div><span>Largest recorded category</span><strong>{sampleFacts.topCategory} · {formatCurrency(sampleFacts.topCategoryMinor)}</strong></div>}{lastPreset === 'reduce-dining-10' && <><div><span>Dining expense reduced</span><strong>+{formatCurrency(sampleFacts.diningCutMinor)}</strong></div><div><span>Scenario projection</span><strong>{formatCurrency(sampleFacts.projectionAfterDiningCutMinor)}</strong></div></>}</div>}{source === 'fallback' && <small>AI service is optional; this explanation uses Finaura’s preset sample rules.</small>}</div>}</div>}
  </section>;
}

function App() {
  const [mode, setMode] = useState('sample');
  const [scenario, setScenario] = useState(() => createSampleScenario());
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planOpen, setPlanOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getForecast(scenario).then((result) => { if (!cancelled) { setForecast(result); setError(''); } }).catch((requestError) => { if (!cancelled) { setForecast(null); setError(requestError.message); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [scenario]);

  const updateScenario = (updater) => setScenario((current) => typeof updater === 'function' ? updater(current) : { ...current, ...updater });
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${scenario.asOfDate}T00:00:00`)), [scenario.asOfDate]);
  const status = forecast?.status || 'INSUFFICIENT_DATA';
  const statusNames = { INSUFFICIENT_DATA: 'Insufficient data', POTENTIAL_SHORTFALL: 'Potential shortfall', CAUTION: 'Caution', ON_TRACK: 'On track' };
  const tones = { INSUFFICIENT_DATA: 'neutral', POTENTIAL_SHORTFALL: 'risk', CAUTION: 'caution', ON_TRACK: 'good' };

  function loadSample() { setMode('sample'); setScenario(createSampleScenario()); setPlanOpen(false); setToast('Fictional sample loaded.'); }
  function startPersonal() { setMode('personal'); setScenario(emptyScenario()); setPlanOpen(true); setForecast(null); setToast('Your figures stay in this browser session and local service.'); }
  function jump(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function showError(message) { setError(message); setToast(''); }
  function showToast(message) { setToast(message); window.setTimeout(() => setToast(''), 3500); }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Finaura home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>finaura<span className="brand-dot">.</span></span></a><nav className="main-nav" aria-label="Main navigation"><a href="#overview">Overview</a><a href="#activity">Spending</a><a href="#goals">Goals</a><a href="#copilot">Copilot</a></nav><div className="session-pill"><span className={`mode-dot ${mode}`} />{mode === 'sample' ? 'Fictional sample' : 'Private session'}</div></header>
    <main id="top" className="page-wrap">
      <section id="overview" className="welcome-row"><div><p className="date-kicker"><span className="calendar-mark" aria-hidden="true">▦</span>MONTHLY MONEY CHECK-IN <span>·</span>{dateLabel.toUpperCase()}</p><h1>Your money, <span>in focus.</span></h1><p className="welcome-copy">See what you have, what is still coming, and a practical way to feel more in control.</p></div><div className="welcome-actions"><button className="button button-primary" type="button" onClick={loadSample}>✦ {mode === 'sample' ? 'Reset sample' : 'Explore sample'}</button><button className="button button-outline" type="button" onClick={startPersonal}>Use my numbers</button></div></section>
      {mode === 'sample' && <div className="sample-banner"><span className="sample-banner-icon" aria-hidden="true">✦</span><div><strong>Exploring a fictional example</strong><span>These figures are made up for the demo. Your personal finances are never sent to Gemini.</span></div><button type="button" onClick={startPersonal}>Enter my own data <span aria-hidden="true">→</span></button></div>}
      {error && <div className="error-banner" role="alert"><strong>Could not refresh the projection.</strong> {error}<button type="button" onClick={() => setScenario((current) => ({ ...current }))}>Retry</button></div>}
      {loading && <div className="loading-line" role="status"><span />Updating your month from the calculator…</div>}
      <section className={`projection-hero ${tones[status]}`} aria-labelledby="projection-title" aria-live="polite"><div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" /><div className="hero-heading"><div><p className="hero-eyebrow">PROJECTED MONTH-END BALANCE</p><p className="projection-caption">{forecast?.projectionBasis === 'history' ? 'Includes history-based estimated future spending' : forecast?.projectionBasis === 'manual' ? 'Includes your manual daily spending estimate' : 'Basic projection from balance, future income, and planned expenses'}</p></div><span className={`status-badge ${tones[status]}`}><i />{statusNames[status]}</span></div><div className="hero-content"><div className="projection-value">{forecast?.adjustedProjectionMinor == null ? 'Add your details' : formatCurrency(forecast.adjustedProjectionMinor)}</div><div className="hero-formula"><div><span>Available now</span><strong>{formatCurrency(forecast?.currentBalanceMinor)}</strong></div><b>+</b><div><span>Income expected</span><strong>{formatCurrency(forecast?.expectedIncomeMinor)}</strong></div><b>−</b><div><span>Remaining expenses</span><strong>{formatCurrency(forecast?.expectedExpensesMinor)}</strong></div>{forecast?.additionalSpendEstimateMinor != null && <><b>−</b><div><span>Estimated extra spending</span><strong>{formatCurrency(forecast.additionalSpendEstimateMinor)}</strong></div></>}</div></div><div className="hero-bottom"><div className="status-explanation"><span className="status-check" aria-hidden="true">{status === 'ON_TRACK' ? '✓' : status === 'INSUFFICIENT_DATA' ? 'i' : '!'}</span><p><strong>{status === 'ON_TRACK' ? 'Your plan looks on track' : status === 'CAUTION' ? 'A little room to adjust' : status === 'POTENTIAL_SHORTFALL' ? 'There may be a shortfall' : 'Start with the essentials'}</strong><span>{forecast?.statusReason || 'Enter your current balance and what is still expected before month-end to see a reliable estimate.'}</span></p></div>{forecast?.estimateMessage && <span className="estimate-note">{forecast.estimateMessage}</span>}</div></section>

      <section className="summary-section" aria-labelledby="summary-title"><SectionTitle eyebrow="YOUR FINANCIAL SNAPSHOT" title="The important numbers" id="summary-title" note="Past spending is already reflected in your available balance."/><div className="metrics-grid"><MetricCard title="Monthly income" value={formatCurrency(forecast?.incomeMinor)} detail="Income summary" icon="↗" tone="metric-violet"/><MetricCard title="Spent so far" value={formatCurrency(forecast?.expensesSoFarMinor)} detail="Current month" icon="↘" tone="metric-coral"/><MetricCard title="Budget left" value={forecast?.remainingBudgetMinor == null ? 'Not set' : formatCurrency(forecast.remainingBudgetMinor)} detail={forecast?.remainingBudgetMinor == null ? 'Add a limit if useful' : 'Of your monthly limit'} icon="◷" tone="metric-blue"/><MetricCard title="Available now" value={formatCurrency(forecast?.currentBalanceMinor)} detail="Starting balance" icon="◉" tone="metric-teal"/></div></section>

      <Suspense fallback={<section className="panel chart-empty" role="status">Loading spending charts…</section>}><SpendingCharts forecast={forecast} /></Suspense>
      <section className={`warning-panel ${status === 'POTENTIAL_SHORTFALL' ? 'warning-risk' : status === 'CAUTION' ? 'warning-caution' : 'warning-calm'}`} aria-labelledby="warning-title"><div className="warning-orb" aria-hidden="true">{status === 'ON_TRACK' ? '✓' : status === 'INSUFFICIENT_DATA' ? 'i' : '!'}</div><div className="warning-copy"><p className="eyebrow">FINANCIAL EARLY WARNING</p><h2 id="warning-title">{status === 'POTENTIAL_SHORTFALL' ? 'A possible cash shortage is ahead' : status === 'CAUTION' ? 'Your safety buffer could get tight' : status === 'INSUFFICIENT_DATA' ? 'We need a little more information' : 'Your current plan is above its safety buffer'}</h2><p><strong>Trigger:</strong> {forecast?.statusReason || 'Add your balance and confirm expected income and expenses to set a reliable status.'}</p>{forecast?.warnings?.length > 0 && <ul className="warning-actions">{forecast.warnings.slice(0, 3).map((item, index) => <li key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.action}</span></li>)}</ul>}</div><span className="warning-tag">{statusNames[status]}</span></section>

      <TransactionTools scenario={scenario} setScenario={updateScenario} onError={showError} />

      <section className="analysis-grid"><div className="panel insight-panel"><SectionTitle eyebrow="AI FINANCIAL INSIGHTS" title="Useful next steps" note="Recommendations come from calculated facts in this session."/>{forecast?.insights?.length ? <div className="insight-list">{forecast.insights.map((item, index) => <article className="insight-item" key={`${item.title}-${index}`}><span className="insight-spark" aria-hidden="true">✦</span><div><h3>{item.title}</h3><p>{item.reason}</p><strong>{item.action}</strong></div></article>)}</div> : <div className="empty-inline">No spending risks to explain yet. Add data to unlock relevant insights.</div>}</div><div className="panel recurring-panel"><SectionTitle eyebrow="RECURRING PAYMENT CHECK" title="Charges that may repeat" note="Pattern match only; not a confirmed subscription."/>{forecast?.potentialRecurring?.length ? forecast.potentialRecurring.map((item, index) => <article className="recurring-item" key={`${item.merchant}-${index}`}><span className="subscription-icon" aria-hidden="true">↻</span><div><strong>{item.merchant}</strong><small>{item.label} · {item.dates.join(' and ')}</small></div><b>{formatCurrency(item.monthlyCostMinor)}<small>/month</small></b></article>) : <div className="empty-inline">No likely recurring charge found in up to 90 days of history. Add more dated transactions to check.</div>}</div></section>

      <SpendingPatterns forecast={forecast} />

      <GoalPanel scenario={scenario} setScenario={updateScenario} forecast={forecast} />
      <div className="quick-action-strip" aria-label="Quick actions"><button type="button" onClick={() => jump('activity')}><span>＋</span>Add a transaction</button><button type="button" onClick={() => { jump('activity'); window.setTimeout(() => document.querySelector('input[type=file]')?.click(), 450); }}><span>⇧</span>Import CSV</button><button type="button" onClick={() => jump('simulator')}><span>◇</span>Try a what-if</button><button type="button" onClick={() => setPlanOpen((open) => !open)}><span>⚙</span>{planOpen ? 'Close setup' : 'Edit monthly plan'}</button></div>
      {planOpen && <PlanInputs key={mode} scenario={scenario} onClose={() => setPlanOpen(false)} onSave={(values) => { setScenario((current) => ({ ...current, ...values })); setPlanOpen(false); }} />}
      <Simulator scenario={scenario} setScenario={updateScenario} forecast={forecast} />

      <section className="panel report-panel" aria-labelledby="report-title"><SectionTitle eyebrow="MONTHLY REPORT" title="A clear summary of this month" id="report-title" note="Only supplied data is included; no missing values are invented."/><div className="report-grid"><div><span>Basic month-end balance</span><strong>{formatCurrency(forecast?.basicProjectionMinor)}</strong></div><div><span>History-based extra spend</span><strong>{forecast?.additionalSpendEstimateMinor == null ? 'Not estimated' : formatCurrency(forecast.additionalSpendEstimateMinor)}</strong><small>{forecast?.estimateSource === 'history' ? `${forecast.eligibleHistoryDays} dated days used` : 'Requires enough current-month data'}</small></div><div><span>Recorded transactions</span><strong>{scenario.transactions.length}</strong><small>In the current session</small></div><div><span>Projection status</span><strong>{statusNames[status]}</strong><small>{forecast?.projectionBasis || 'Waiting for required information'}</small></div></div><p className="report-footnote">Monthly spending uses recorded transactions. Your current balance is the starting point, so those past purchases are not subtracted from the projection again.</p></section>

      <Copilot mode={mode} scenario={scenario} forecast={forecast} />
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="#top">finaura<span className="brand-dot">.</span></a><span>Money guidance based on your numbers · Not financial advice</span><span>Adults 18+ · Local session only</span></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

function SpendingPatterns({ forecast }) {
  const trends = forecast?.patternFindings?.filter((item) => item.type === 'category-increase') || [];
  const anomalies = forecast?.patternFindings?.filter((item) => item.type === 'unusual-spend') || [];
  return <section className="panel patterns-panel" aria-labelledby="patterns-title"><SectionTitle eyebrow="SPENDING PATTERNS" title="Changes worth noticing" id="patterns-title" note="Patterns appear only when transaction history supports the comparison."/>{trends.length || anomalies.length ? <div className="pattern-grid">{trends.map((item) => <article className="pattern-card" key={`${item.category}-trend`}><span className="pattern-icon">↗</span><div><strong>{item.category} spending is up {item.increasePercent}%</strong><p>{formatCurrency(item.currentMinor)} this period, compared with {formatCurrency(item.previousMinor)} over the same days last month.</p></div></article>)}{anomalies.map((item) => <article className="pattern-card" key={item.transactionId}><span className="pattern-icon">!</span><div><strong>Unusual {item.category.toLowerCase()} expense</strong><p>{item.merchant} was {formatCurrency(item.amountMinor)}; the median of earlier category purchases was {formatCurrency(item.categoryMedianMinor)}.</p></div></article>)}</div> : <div className="empty-inline">{forecast?.eligibleHistoryDays >= 14 ? 'No large spending changes are flagged by the current rules.' : 'Not enough spending history to compare patterns yet. Add at least 14 dated days for the relevant period.'}</div>}</section>;
}

export default App;
