import { v4 as uuid } from 'uuid';
import City from '../models/City.js';
import Journey from '../models/Journey.js';
import JourneyRequest from '../models/JourneyRequest.js';
import { generateItineraries } from '../algorithms/routeEngine.js';



export async function plan(req, res) {
  const b = req.body || {};

  // Cities and date must be plain strings (blocks query-operator injection).
  if (typeof b.source !== 'string' || typeof b.destination !== 'string' || typeof b.date !== 'string') {
    return res.status(400).json({ message: 'Invalid journey details.' });
  }

  if (!b.source || !b.destination || b.source === b.destination) {
    return res.status(400).json({
      message: 'Choose two different cities.'
    });
  }

  if (!b.date || Number.isNaN(Date.parse(b.date))) {
    return res.status(400).json({
      message: 'Choose a valid journey date.'
    });
  }

  if (new Date(b.date + 'T00:00:00') < new Date(new Date().toDateString())) {
    return res.status(400).json({
      message: 'Journey date cannot be in the past.'
    });
  }

  // Verify cities using MongoDB
  const cities = await City.find(
    { name: { $in: [b.source, b.destination] }, available: { $ne: false } }
  ).lean();

  if (
    !cities.some(c => c.name === b.source) ||
    !cities.some(c => c.name === b.destination)
  ) {
    return res.status(400).json({
      message: 'Select cities from the provided list.'
    });
  }

  if (b.modes !== undefined && !(Array.isArray(b.modes) && b.modes.length <= 3 && b.modes.every(m => typeof m === 'string' && m.length <= 20))) {
    return res.status(400).json({ message: 'Invalid travel modes.' });
  }

  // Clamp numeric inputs to sane ranges (also removes NaN).
  const clamp = (value, min, max) => {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  };

  const input = {
    ...b,
    travellers: clamp(b.travellers || 1, 1, 100),
    overnightStays: clamp(b.overnightStays || 0, 0, 30)
  };

  const itineraries = await generateItineraries(input);

  // Save search request in MongoDB
  await JourneyRequest.create({
    id: uuid(),
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    input,
    resultsCount: itineraries.length
  });

  const overBudget =
    itineraries.length > 0 &&
    itineraries.every(item => item.withinBudget === false);

  const limited = itineraries.length > 0 && itineraries.length < 3;

  const message = itineraries.length
    ? (
        overBudget
          ? 'No plan fits this budget. Showing the closest simulated options.'
          : limited
            ? `Only ${itineraries.length} feasible plan${itineraries.length === 1 ? '' : 's'} found in the sample network for these cities and modes.`
            : 'Plans generated from simulated schedules.'
      )
    : 'No feasible route found for these preferences. The sample network may not connect these cities with the selected modes.';

  res.json({
    itineraries,
    simulated: true,
    overBudget,
    message
  });
}


export async function save(req, res) {
  const { id: ignoredId, userId: ignoredUserId, _id: ignoredMongoId, createdAt: ignoredCreatedAt, ...body } = req.body || {};

  if (typeof body.source !== 'string' || typeof body.destination !== 'string' || !body.source || !body.destination) {
    return res.status(400).json({ message: 'Invalid journey.' });
  }

  const record = await Journey.create({
    ...body,
    id: uuid(),
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    title: `${body.source} to ${body.destination}`
  });

  res.status(201).json(record);
}


export async function history(req, res) {
  const journeys = await Journey.find({
    userId: req.user.id
  }).sort({ _id: -1 }).lean();

  res.json(journeys);
}


export async function remove(req, res) {
  const found = await Journey.findOneAndDelete({
    id: String(req.params.id),
    userId: req.user.id
  });

  if (!found) {
    return res.status(404).json({
      message: 'Journey not found.'
    });
  }

  res.json({
    message: 'Journey deleted.'
  });
}