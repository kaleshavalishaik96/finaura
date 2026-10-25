import express from 'express';
import forecastRoute from './routes/forecast.js';
import sampleExplanationRoute from './routes/sampleExplanation.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.use('/api/forecast', forecastRoute);
app.use('/api/sample-explanation', sampleExplanationRoute);

app.listen(port, '127.0.0.1', () => {
  console.log(`Finaura API listening on http://127.0.0.1:${port}`);
});
