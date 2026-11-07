import { readData, writeData } from '../utils/dataStore.js';
import { v4 as uuid } from 'uuid';

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

function findCity(cities, name) {
  const wanted = text(name).toLowerCase();
  return cities.find((city) => city.name.toLowerCase() === wanted);
}

export async function dashboard(_req, res) {
  const [users, journeys, requests, cities, transport, hotels, feedback] = await Promise.all(
    ['users', 'journeys', 'requests', 'cities', 'transport', 'hotels', 'feedback'].map(readData)
  );
  res.json({
    users: users.filter((user) => user.role !== 'admin').length,
    savedJourneys: journeys.length,
    generatedRequests: requests.length,
    cities: cities.length,
    connections: transport.length,
    hotels: hotels.length,
    recentFeedback: feedback.slice(-8).reverse()
  });
}

export async function listResource(req, res) {
  if (!tables.includes(req.params.resource)) return res.status(404).json({ message: 'Unknown resource.' });
  res.json(await readData(req.params.resource));
}

export async function createResource(req, res) {
  const name = req.params.resource;
  if (!tables.includes(name)) return res.status(404).json({ message: 'Unknown resource.' });

  const data = await readData(name);
  const body = req.body || {};
  let item = { id: uuid(), available: true };

  if (name === 'cities') {
    const cityName = text(body.name);
    const state = text(body.state);
    const latitude = number(body.latitude);
    const longitude = number(body.longitude);
    if (!cityName || !state) return res.status(400).json({ message: 'City name and state are required.' });
    if (!Number.isFinite(latitude) || latitude < 6 || latitude > 38) {
      return res.status(400).json({ message: 'Enter a latitude inside India, between 6 and 38.' });
    }
    if (!Number.isFinite(longitude) || longitude < 68 || longitude > 98) {
      return res.status(400).json({ message: 'Enter a longitude inside India, between 68 and 98.' });
    }
    if (data.some((city) => city.name.toLowerCase() === cityName.toLowerCase())) {
      return res.status(400).json({ message: 'That city is already in the list.' });
    }
    item = { ...item, name: cityName, state, latitude, longitude };
  }

  if (name === 'transport') {
    const cities = await readData('cities');
    const from = findCity(cities, body.from);
    const to = findCity(cities, body.to);
    const mode = modes.find((entry) => entry.toLowerCase() === text(body.mode).toLowerCase());
    const departure = clock(body.departure);
    const arrival = clock(body.arrival);
    const durationHours = number(body.durationHours);
    const distanceKm = number(body.distanceKm);
    const farePerPerson = number(body.farePerPerson);
    if (!from || !to) return res.status(400).json({ message: 'Choose a source and destination from the city list.' });
    if (from.id === to.id) return res.status(400).json({ message: 'Source and destination must be different cities.' });
    if (!mode) return res.status(400).json({ message: 'Mode must be Train, Bus, or Flight.' });
    if (!departure || !arrival) return res.status(400).json({ message: 'Enter departure and arrival as HH:MM.' });
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return res.status(400).json({ message: 'Duration must be a number of hours greater than 0.' });
    }
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      return res.status(400).json({ message: 'Distance must be a positive number of kilometres.' });
    }
    if (!Number.isFinite(farePerPerson) || farePerPerson <= 0) {
      return res.status(400).json({ message: 'Fare per person must be greater than 0.' });
    }
    item = {
      ...item,
      from: from.name,
      to: to.name,
      mode,
      service: text(body.service) || `${mode} ${data.length + 1}`,
      departure,
      arrival,
      durationHours,
      distanceKm,
      farePerPerson,
      days: ['Daily']
    };
  }

  if (name === 'hotels') {
    const cities = await readData('cities');
    const city = findCity(cities, body.city);
    const hotelName = text(body.name);
    const pricePerNight = number(body.pricePerNight);
    const rating = number(body.rating);
    const type = text(body.type) || 'Standard';
    if (!hotelName) return res.status(400).json({ message: 'Hotel name is required.' });
    if (!city) return res.status(400).json({ message: 'Choose a city from the city list.' });
    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      return res.status(400).json({ message: 'Nightly price must be greater than 0.' });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number from 1 to 5.' });
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

  data.push(item);
  await writeData(name, data);
  res.status(201).json(item);
}

export async function deleteResource(req, res) {
  const name = req.params.resource;
  if (!tables.includes(name)) return res.status(404).json({ message: 'Unknown resource.' });
  const data = await readData(name);
  const next = data.filter((row) => row.id !== req.params.id);
  if (next.length === data.length) return res.status(404).json({ message: 'Record not found.' });
  await writeData(name, next);
  res.json({ message: 'Record deleted.' });
}

export async function users(_req, res) {
  res.json((await readData('users')).map(({ passwordHash, ...user }) => user));
}

export async function feedback(_req, res) {
  res.json(await readData('feedback'));
}