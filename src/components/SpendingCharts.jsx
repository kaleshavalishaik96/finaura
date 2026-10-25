import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../lib/formatCurrency.js';

const chartColors = ['#7159e8', '#34a9aa', '#f1a765', '#7288ee', '#d978aa', '#52a886', '#ad8ce8'];

function SectionTitle({ eyebrow, title, note, id }) {
  return <div className="section-title"><div><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2></div>{note && <p className="section-note">{note}</p>}</div>;
}

export default function SpendingCharts({ forecast }) {
  const categoryData = forecast?.categoryTotals || [];
  const dailyData = (forecast?.dailyTotals || []).slice(-15);
  return <section className="panel" aria-labelledby="spending-title"><SectionTitle eyebrow="SPENDING OVERVIEW" title="See where your money goes" id="spending-title" note="Recorded expenses only; chart values do not affect your current balance twice."/>
    <div className="charts-grid"><div className="chart-card"><h3>By category</h3>{categoryData.length ? <><div className="pie-wrap"><ResponsiveContainer width="100%" height={220}><PieChart accessibilityLayer><Pie data={categoryData} dataKey="amountMinor" nameKey="name" innerRadius={57} outerRadius={86} paddingAngle={3}>{categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer></div><ul className="legend-list">{categoryData.map((row, index) => <li key={row.name}><i style={{ background: chartColors[index % chartColors.length] }} />{row.name}<strong>{formatCurrency(row.amountMinor)}</strong></li>)}</ul></> : <div className="chart-empty">Add transactions to see a category breakdown.</div>}</div>
      <div className="chart-card"><h3>Daily spending trend</h3>{dailyData.length ? <><div className="trend-wrap"><ResponsiveContainer width="100%" height={255}><BarChart data={dailyData} accessibilityLayer margin={{ top: 12, right: 6, left: 2, bottom: 0 }}><CartesianGrid stroke="#eeedf5" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => value.slice(8)} tick={{ fill: '#747991', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `₹${Math.round(value / 100)}`} tick={{ fill: '#747991', fontSize: 10 }} axisLine={false} tickLine={false} width={52} /><Tooltip labelFormatter={(value) => `Date ${value}`} formatter={(value) => formatCurrency(value)} /><Bar dataKey="amountMinor" name="Spent" fill="#7461df" radius={[6, 6, 0, 0]} maxBarSize={27} /></BarChart></ResponsiveContainer></div><p className="chart-caption">Each bar is recorded spending on that date. The current balance already includes past spending.</p></> : <div className="chart-empty">Your daily trend will appear after you add or import dated transactions.</div>}</div></div>
  </section>;
}
