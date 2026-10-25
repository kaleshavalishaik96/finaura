import { Router } from 'express';
import { calculateForecast } from '../services/financeCalculator.js';

const router = Router();

router.post('/', (request, response) => {
  try {
    response.json(calculateForecast(request.body));
  } catch (error) {
    if (error.details) {
      response.status(400).json({ message: error.message, errors: error.details });
      return;
    }
    response.status(500).json({ message: 'The forecast could not be calculated.' });
  }
});

export default router;
