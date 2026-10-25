import { Router } from 'express';
import { explainFictionalSample } from '../services/sampleExplanation.js';
import { isAllowedPresetBody } from '../data/presets.js';

const router = Router();

router.post('/', async (request, response) => {
  const body = request.body;
  if (!isAllowedPresetBody(body)) {
    response.status(400).json({ message: 'Choose one of the four fixed sample questions.' });
    return;
  }
  response.json(await explainFictionalSample(body.presetId));
});

export default router;
