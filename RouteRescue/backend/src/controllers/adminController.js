
import { v4 as uuid } from 'uuid';

import User from '../models/User.js';
import City from '../models/City.js';
import Transport from '../models/Transport.js';
import Hotel from '../models/Hotel.js';
import Journey from '../models/Journey.js';
import JourneyRequest from '../models/JourneyRequest.js';
import Feedback from '../models/Feedback.js';

const tables = ['cities', 'transport', 'hotels'];
const modes = ['Train', 'Bus', 'Flight'];

function text(value) {
  return String(value ?? '').trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function clock(value) {
  const match = text(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';

  const hours = Number(match[1]);
  const mins = Number(match[2]);

  if (hours > 23 || mins > 59) return '';

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

async function findCity(name) {
  const wanted = text(name).toLowerCase();
  const cities = await City.find().lean();

  return cities.find(
    city => city.name.toLowerCase() === wanted
  );
}

function getModel(resource) {
  if (resource === 'cities') return City;
  if (resource === 'transport') return Transport;
  if (resource === 'hotels') return Hotel;
  return null;
}

export async function dashboard(_req, res) {
  const [
    users,
    savedJourneys,
    generatedRequests,
    cities,
    connections,
    hotels,
    recentFeedback
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Journey.countDocuments(),
    JourneyRequest.countDocuments(),
    City.countDocuments(),
    Transport.countDocuments(),
    Hotel.countDocuments(),
    Feedback.find().sort({ createdAt: -1 }).limit(8).lean()
  ]);

  res.json({
    users,
    savedJourneys,
    generatedRequests,
    cities,
    connections,
    hotels,
    recentFeedback
  });
}

export async function listResource(req, res) {
  const Model = getModel(req.params.resource);

  if (!Model) {
    return res.status(404).json({ message: 'Unknown resource.' });
  }

  const records = await Model.find().lean();
  res.json(records);
}

export async function createResource(req, res) {
  const name = req.params.resource;
  const Model = getModel(name);

  if (!Model) {
    return res.status(404).json({ message: 'Unknown resource.' });
  }

  const body = req.body || {};

  let item = {
    id: uuid(),
    available: true
  };

  if (name === 'cities') {
    const cityName = text(body.name);
    const state = text(body.state);
    const latitude = number(body.latitude);
    const longitude = number(body.longitude);

    if (!cityName || !state) {
      return res.status(400).json({ message: 'City name and state are required.' });
    }

    if (!Number.isFinite(latitude) || latitude < 6 || latitude > 38) {
      return res.status(400).json({
        message: 'Enter a latitude inside India, between 6 and 38.'
      });
    }

    if (!Number.isFinite(longitude) || longitude < 68 || longitude > 98) {
      return res.status(400).json({
        message: 'Enter a longitude inside India, between 68 and 98.'
      });
    }

    const existingCity = await City.findOne({
      name: { $regex: `^${cityName}$`, $options: 'i' }
    });

    if (existingCity) {
      return res.status(400).json({
        message: 'That city is already in the list.'
      });
    }

    item = {
      ...item,
      name: cityName,
      state,
      latitude,
      longitude
    };
  }

  if (name === 'transport') {
    const from = await findCity(body.from);
    const to = await findCity(body.to);

    const mode = modes.find(
      entry => entry.toLowerCase() === text(body.mode).toLowerCase()
    );

    const departure = clock(body.departure);
    const arrival = clock(body.arrival);
    const durationHours = number(body.durationHours);
    const distanceKm = number(body.distanceKm);
    const farePerPerson = number(body.farePerPerson);

    if (!from || !to) {
      return res.status(400).json({
        message: 'Choose a source and destination from the city list.'
      });
    }

    if (from.id === to.id) {
      return res.status(400).json({
        message: 'Source and destination must be different cities.'
      });
    }

    if (!mode) {
      return res.status(400).json({
        message: 'Mode must be Train, Bus, or Flight.'
      });
    }

    if (!departure || !arrival) {
      return res.status(400).json({
        message: 'Enter departure and arrival as HH:MM.'
      });
    }

    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return res.status(400).json({
        message: 'Duration must be a number of hours greater than 0.'
      });
    }

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      return res.status(400).json({
        message: 'Distance must be a positive number of kilometres.'
      });
    }

    if (!Number.isFinite(farePerPerson) || farePerPerson <= 0) {
      return res.status(400).json({
        message: 'Fare per person must be greater than 0.'
      });
    }

    const count = await Transport.countDocuments();

    item = {
      ...item,
      from: from.name,
      to: to.name,
      mode,
      service: text(body.service) || `${mode} ${count + 1}`,
      departure,
      arrival,
      durationHours,
      distanceKm,
      farePerPerson,
      days: ['Daily']
    };
  }

  if (name === 'hotels') {
    const city = await findCity(body.city);
    const hotelName = text(body.name);
    const pricePerNight = number(body.pricePerNight);
    const rating = number(body.rating);
    const type = text(body.type) || 'Standard';

    if (!hotelName) {
      return res.status(400).json({
        message: 'Hotel name is required.'
      });
    }

    if (!city) {
      return res.status(400).json({
        message: 'Choose a city from the city list.'
      });
    }

    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      return res.status(400).json({
        message: 'Nightly price must be greater than 0.'
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be a number from 1 to 5.'
      });
    }

    item = {
      ...item,
      name: hotelName,
      city: city.name,
      pricePerNight,
      rating,
      type,
      facilities: ['Wi-Fi', '24-hour reception'],
      description: text(body.description) || `${type} stay in ${city.name}.`
    };
  }

  const createdItem = await Model.create(item);

  res.status(201).json(createdItem.toObject());
}

export async function deleteResource(req, res) {
  const Model = getModel(req.params.resource);

  if (!Model) {
    return res.status(404).json({ message: 'Unknown resource.' });
  }

  const deleted = await Model.findOneAndDelete({
    id: req.params.id
  });

  if (!deleted) {
    return res.status(404).json({ message: 'Record not found.' });
  }

  res.json({ message: 'Record deleted.' });
}

export async function users(_req, res) {
  const allUsers = await User.find().select('-passwordHash').lean();
  res.json(allUsers);
}

export async function feedback(_req, res) {
  const allFeedback = await Feedback.find().sort({ createdAt: -1 }).lean();
  res.json(allFeedback);
}
