import { Router } from 'express';
import City from '../models/City.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const cities = await City.find()
      .select('id name state latitude longitude -_id')
      .sort({ name: 1 })
      .lean();

    res.json(cities);
  } catch (error) {
    next(error);
  }
});

export default router;