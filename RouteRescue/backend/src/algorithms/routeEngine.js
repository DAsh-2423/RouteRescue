import { readData } from '../utils/dataStore.js';

// Convert HH:MM into minutes from midnight.
const minutes = (time) => {
  const [hours, mins] = String(time || '0:0').split(':').map(Number);
  return hours * 60 + mins;
};

function clock(totalMinutes) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Map positions of the sample Indian cities. Distances below use these, not the
// duration-based kilometres stored in the sample timetable.
const CITY_COORDINATES = {
  Mumbai: [19.076, 72.8777],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Delhi: [28.6139, 77.209],
  Jaipur: [26.9124, 75.7873],
  Udaipur: [24.5854, 73.7125],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Nagpur: [21.1458, 79.0882],
  Hyderabad: [17.385, 78.4867],
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Lucknow: [26.8467, 80.9462],
  Prayagraj: [25.4358, 81.8463],
  Varanasi: [25.3176, 82.9739],
  Agra: [27.1767, 78.0081],
  Goa: [15.2993, 74.124]
};

// Seed coordinates, plus any city an admin adds with latitude and longitude.
let activeCoordinates = { ...CITY_COORDINATES };

function geographicDistance(cityA, cityB) {
  const a = activeCoordinates[cityA];
  const b = activeCoordinates[cityB];
  if (!a || !b) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function legDistance(leg) {
  return geographicDistance(leg.from, leg.to) || Number(leg.distanceKm) || 0;
}

// Keep a stop only when it lies near the straight line to the destination.
// Ahmedabad → Jaipur is rejected for a Bhopal trip because Jaipur adds a Rajasthan detour.
function hopFollowsMap(current, next, destination) {
  if (next === destination) return true;
  const hopKm = geographicDistance(current, next);
  const remaining = geographicDistance(next, destination);
  const straight = geographicDistance(current, destination);
  if (hopKm == null || remaining == null || straight == null) return false;
  if (remaining > straight + 20) return false;
  // Skip a tiny sideways halt that barely moves you toward the destination.
  if (hopKm < straight * 0.22 && remaining > straight * 0.88) return false;
  return hopKm + remaining <= straight * 1.22 + 45;
}

function connectionTime(previous, next) {
  return (minutes(next.departure) - minutes(previous.arrival) + 1440) % 1440;
}

function pathKey(legs) {
  return legs.map((leg) => `${leg.from}>${leg.to}:${leg.mode}`).join('|');
}

function makeService(from, to, mode, km) {
  const speed = mode === 'Flight' ? 680 : mode === 'Train' ? 52 : 42;
  const rate = mode === 'Flight' ? 4.4 : mode === 'Train' ? 1.35 : 1.55;
  const durationHours = Math.max(0.8, Math.round((km / speed) * 10) / 10);
  const prefix = mode === 'Train' ? 'RR Express' : mode === 'Bus' ? 'RouteLine' : 'SkyHop';
  return {
    id: `map-${from}-${to}-${mode}`,
    from,
    to,
    mode,
    service: `${prefix} ${Math.round(km)}`,
    departure: '06:00',
    arrival: '06:00',
    durationHours,
    distanceKm: Math.round(km),
    farePerPerson: Math.max(80, Math.round((km * rate) / 10) * 10),
    available: true,
    simulated: true
  };
}

// Real sample service when one exists. Otherwise a fare and time derived from map distance.
function servicesForHop(from, to, sampleEdges, allowedModes) {
  const km = geographicDistance(from, to);
  const sample = sampleEdges.filter((edge) => edge.from === from && edge.to === to && edge.available !== false);
  const modes = new Set(sample.map((edge) => edge.mode).filter((mode) => allowedModes.has(mode.toLowerCase())));
  if (km <= 850 && allowedModes.has('bus')) modes.add('Bus');
  if (km <= 1700 && allowedModes.has('train')) modes.add('Train');
  if ((km >= 350 || sample.some((edge) => edge.mode === 'Flight')) && allowedModes.has('flight')) modes.add('Flight');

  return [...modes].map((mode) => {
    const existing = sample
      .filter((edge) => edge.mode === mode)
      .sort((a, b) => Number(a.farePerPerson) - Number(b.farePerPerson))[0];
    if (existing) return { ...existing, distanceKm: Math.round(km || existing.distanceKm) };
    return makeService(from, to, mode, km);
  });
}

function chooseService(options, objective) {
  const ranked = [...options].sort((a, b) => {
    if (objective === 'fastest') return a.durationHours - b.durationHours || a.farePerPerson - b.farePerPerson;
    if (objective === 'cheapest') return a.farePerPerson - b.farePerPerson || a.durationHours - b.durationHours;
    const score = (edge) => edge.farePerPerson / 40 + edge.durationHours * 8 + (edge.mode === 'Flight' ? 6 : 0);
    return score(a) - score(b);
  });
  return ranked[0];
}

function firstDeparture(mode) {
  if (mode === 'Flight') return '09:20';
  if (mode === 'Bus') return '07:40';
  return '06:10';
}

// Place each leg after the previous one so the change of service is always possible.
function scheduleLegs(services) {
  let departAt = minutes(firstDeparture(services[0].mode));
  return services.map((service) => {
    const durationMin = Math.round(Number(service.durationHours) * 60);
    const leg = {
      ...service,
      departure: clock(departAt),
      arrival: clock(departAt + durationMin)
    };
    departAt += durationMin + 75;
    return leg;
  });
}

function candidateCities(current, destination, visited) {
  const nextCities = Object.keys(activeCoordinates).filter((city) => !visited.has(city));
  const useful = nextCities.filter((city) => {
    if (!hopFollowsMap(current, city, destination)) return false;
    const km = geographicDistance(current, city);
    if (city === destination) return true;
    return km >= 70 && km <= 1250;
  });
  useful.sort((a, b) => {
    const viaA = geographicDistance(current, a) + geographicDistance(a, destination);
    const viaB = geographicDistance(current, b) + geographicDistance(b, destination);
    return viaA - viaB;
  });
  const destinationIndex = useful.indexOf(destination);
  const limited = useful.slice(0, 5);
  if (destinationIndex >= 5) limited.push(destination);
  return limited;
}

// Shortest sensible corridors first. Extra stops are kept only when they stay on the map.
function findCorridors(source, destination) {
  const directKm = geographicDistance(source, destination);
  const found = [];

  function walk(city, hops, visited) {
    if (hops.length > 3 || found.length > 40) return;
    if (city === destination && hops.length) {
      const travelled = hops.reduce((sum, hop) => sum + hop.km, 0);
      if (hops.length === 1 || travelled <= directKm * 1.32 + 70) found.push(hops);
      return;
    }
    if (hops.length === 3) return;
    for (const next of candidateCities(city, destination, visited)) {
      walk(next, [...hops, { from: city, to: next, km: geographicDistance(city, next) }], new Set([...visited, next]));
    }
  }

  walk(source, [], new Set([source]));
  found.sort((a, b) => {
    const score = (hops) => hops.reduce((sum, hop) => sum + hop.km, 0) + (hops.length - 1) * 140;
    return score(a) - score(b) || a.length - b.length;
  });

  const unique = [];
  const seen = new Set();
  for (const hops of found) {
    const key = hops.map((hop) => hop.to).join('>');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hops);
    if (unique.length === 6) break;
  }
  return unique;
}

function buildPath(hops, sampleEdges, objective, allowedModes) {
  const chosen = hops.map((hop) => {
    const options = servicesForHop(hop.from, hop.to, sampleEdges, allowedModes);
    if (!options.length) return null;
    return chooseService(options, objective);
  });
  if (chosen.some((service) => !service)) return null;
  return { legs: scheduleLegs(chosen) };
}

function edgeWeight(path, objective) {
  const fare = path.legs.reduce((sum, leg) => sum + Number(leg.farePerPerson), 0);
  const minutesTotal = path.legs.reduce((sum, leg) => sum + Number(leg.durationHours) * 60, 0);
  const km = path.legs.reduce((sum, leg) => sum + legDistance(leg), 0);
  const transfers = Math.max(0, path.legs.length - 1);
  if (objective === 'cheapest') return fare + transfers * 180 + km * 0.2;
  if (objective === 'fastest') return minutesTotal + transfers * 40 + km * 0.05;
  return fare / 35 + minutesTotal / 8 + transfers * 25;
}

// Two or three plans: different modes on the most direct corridor, then a second map corridor.
function selectPlans(corridors, sampleEdges, preference, allowedModes) {
  const drafts = [];
  const seen = new Set();
  const add = (hops, objective) => {
    if (!hops || drafts.length >= 3) return;
    const path = buildPath(hops, sampleEdges, objective, allowedModes);
    if (!path) return;
    const key = pathKey(path.legs);
    if (seen.has(key)) return;
    seen.add(key);
    drafts.push(path);
  };

  // On a direct ride, offer each available mode so bus, train and flight stay separate.
  if (corridors[0]?.length === 1) {
    const hop = corridors[0][0];
    const byMode = ['Bus', 'Train', 'Flight'];
    for (const mode of byMode) {
      const service = servicesForHop(hop.from, hop.to, sampleEdges, allowedModes).find((item) => item.mode === mode);
      if (!service || drafts.length >= 3) continue;
      const key = `${hop.from}>${hop.to}:${mode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push({ legs: scheduleLegs([service]) });
    }
  }

  add(corridors[0], 'cheapest');
  add(corridors[0], 'fastest');
  add(corridors[0], 'balanced');
  for (const corridor of corridors.slice(1)) add(corridor, preference || 'balanced');
  for (const corridor of corridors) add(corridor, preference || 'fastest');

  drafts.sort((a, b) => edgeWeight(a, preference || 'balanced') - edgeWeight(b, preference || 'balanced'));
  return drafts.slice(0, 3);
}

function chooseStay(input, legs) {
  const preference = input.accommodation || 'none';
  const requestedNights = Math.max(0, Number(input.overnightStays || 0));
  const intermediates = legs.slice(0, -1).map((leg) => leg.to);

  if (preference === 'none' || requestedNights === 0) {
    return {
      city: null,
      nights: 0,
      reason: 'No accommodation was added because the request does not ask for an overnight stay.'
    };
  }

  const waits = legs.slice(0, -1).map((leg, index) => ({
    city: leg.to,
    wait: connectionTime(leg, legs[index + 1])
  }));
  const longestWait = waits.reduce(
    (best, item) => (item.wait > best.wait ? item : best),
    { city: null, wait: 0 }
  );
  const movingHours = legs.reduce((sum, leg) => sum + Number(leg.durationHours || 0), 0);
  const shortJourney = movingHours < 8 && longestWait.wait < 360;

  if (preference === 'intermediate') {
    if (!intermediates.length) {
      return {
        city: null,
        nights: 0,
        reason: 'This route has no intermediate city, so the stay is not forced onto a detour.'
      };
    }
    return {
      city: longestWait.city || intermediates[0],
      nights: requestedNights,
      reason: `Overnight stay is at ${longestWait.city || intermediates[0]}, a city already on this route.`
    };
  }

  if (preference === 'flexible' && !shortJourney && longestWait.city && longestWait.wait >= 300) {
    return {
      city: longestWait.city,
      nights: requestedNights,
      reason: `Flexible stay is at ${longestWait.city} because that connection is long enough for a break.`
    };
  }

  return {
    city: input.destination,
    nights: requestedNights,
    reason: shortJourney
      ? `The journey is short, so the ${requestedNights} night stay is at ${input.destination}.`
      : `Overnight stay is at the destination, ${input.destination}.`
  };
}

function buildItinerary(path, input, hotels, budget) {
  const travellers = Math.max(1, Number(input.travellers || 1));
  const legs = path.legs.map((leg, index) => ({
    ...leg,
    transferAfter: index < path.legs.length - 1
      ? `${leg.to} · ${connectionTime(leg, path.legs[index + 1])} min connection`
      : null
  }));
  const movingHours = legs.reduce((sum, leg) => sum + Number(leg.durationHours || 0), 0);
  const waitingHours = legs.slice(0, -1).reduce(
    (sum, leg, index) => sum + connectionTime(leg, legs[index + 1]) / 60,
    0
  );
  const travelCost = legs.reduce((sum, leg) => sum + Number(leg.farePerPerson || 0), 0);
  const stay = chooseStay(input, legs);
  const remainingBudget = Number.isFinite(budget) ? budget - travelCost : Infinity;

  let picks = [];
  if (stay.city) {
    picks = hotels
      .filter((hotel) => hotel.city === stay.city && hotel.available !== false)
      .sort((a, b) => b.rating - a.rating || a.pricePerNight - b.pricePerNight);
    const affordable = picks.filter((hotel) => Number(hotel.pricePerNight) * stay.nights <= remainingBudget);
    if (affordable.length) picks = affordable;
    picks = picks.slice(0, 3);
  }

  const chosen = picks[0] || null;
  const hotelCost = chosen ? Number(chosen.pricePerNight) * stay.nights : 0;
  const totalPerPerson = travelCost + hotelCost;
  const transfers = Math.max(0, legs.length - 1);
  const modeList = [...new Set(legs.map((leg) => leg.mode))].join(', ');

  return {
    id: pathKey(legs),
    name: transfers === 0 ? `Direct ${legs[0].mode}` : `${transfers}-transfer ${modeList}`,
    source: input.source,
    destination: input.destination,
    legs,
    totalDurationHours: movingHours,
    elapsedDurationHours: movingHours + waitingHours,
    transfers,
    intermediateCities: legs.slice(0, -1).map((leg) => leg.to),
    transportationCostPerPerson: travelCost,
    accommodation: {
      required: Boolean(stay.city && chosen),
      requested: Boolean(stay.city),
      city: stay.city,
      nights: stay.city ? stay.nights : 0,
      reason: stay.reason,
      hotel: chosen,
      alternatives: picks,
      totalPerPerson: hotelCost,
      withinBudget: !stay.city || !chosen || hotelCost <= remainingBudget
    },
    totalPerPerson,
    totalGroupCost: totalPerPerson * travellers,
    withinBudget: totalPerPerson <= budget,
    category: 'balanced',
    highlights: [],
    explanation: '',
    simulated: true
  };
}

function describe(itinerary) {
  const modes = itinerary.legs.map((leg) => leg.mode).join(' → ');
  const badges = itinerary.highlights.join(' and ') || 'A practical';
  const stay = itinerary.accommodation.reason || '';
  const via = itinerary.transfers === 0
    ? 'No intermediate halt.'
    : `${itinerary.transfers} stop${itinerary.transfers === 1 ? '' : 's'} at ${itinerary.intermediateCities.join(', ')}.`;
  return `${badges} option using ${modes}. ${via} ${stay}`.replace(/\s+/g, ' ').trim();
}

function tagHighlights(itineraries) {
  if (!itineraries.length) return itineraries;
  const cheapestFare = Math.min(...itineraries.map((item) => item.transportationCostPerPerson));
  const fastestTime = Math.min(...itineraries.map((item) => item.elapsedDurationHours));
  const balancedScore = (item) =>
    item.transportationCostPerPerson / cheapestFare +
    item.elapsedDurationHours / fastestTime +
    item.transfers * 0.35;
  const winner = (score) =>
    [...itineraries].sort((a, b) => score(a) - score(b) || a.totalPerPerson - b.totalPerPerson)[0];

  const badges = [
    [winner((item) => item.totalPerPerson), 'Cheapest'],
    [winner((item) => item.elapsedDurationHours), 'Fastest'],
    [winner(balancedScore), 'Best balanced']
  ];
  for (const item of itineraries) item.highlights = [];
  for (const [item, label] of badges) {
    if (item && !item.highlights.includes(label)) item.highlights.push(label);
  }

  return itineraries.map((item) => {
    const category = item.highlights[0] === 'Cheapest'
      ? 'cheapest'
      : item.highlights[0] === 'Fastest'
        ? 'fastest'
        : 'balanced';
    const tagged = { ...item, category };
    tagged.explanation = describe(tagged);
    return tagged;
  });
}

export async function generateItineraries(input) {
  const cityRecords = await readData('cities');
  activeCoordinates = { ...CITY_COORDINATES };
  for (const city of cityRecords) {
    const latitude = Number(city.latitude);
    const longitude = Number(city.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      activeCoordinates[city.name] = [latitude, longitude];
    }
  }
  if (!activeCoordinates[input.source] || !activeCoordinates[input.destination]) return [];
  if (input.source === input.destination) return [];

  const sampleEdges = await readData('transport');
  const hotels = await readData('hotels');
  const budget = Number(input.budget) > 0 ? Number(input.budget) : Infinity;
  const requested = new Set((input.modes?.length ? input.modes : ['Train', 'Bus', 'Flight']).map((mode) => String(mode).toLowerCase()));

  const corridors = findCorridors(input.source, input.destination);
  let plans = selectPlans(corridors, sampleEdges, input.optimization || 'balanced', requested);

  if (plans.length < 2) {
    const direct = [{ from: input.source, to: input.destination, km: geographicDistance(input.source, input.destination) }];
    const rebuilt = [];
    for (const objective of ['cheapest', 'fastest', 'balanced']) {
      const path = buildPath(direct, sampleEdges, objective, requested);
      if (path) rebuilt.push(path);
    }
    const seen = new Set(plans.map((plan) => pathKey(plan.legs)));
    for (const path of rebuilt) {
      const key = pathKey(path.legs);
      if (!seen.has(key)) {
        seen.add(key);
        plans.push(path);
      }
    }
  }

  const itineraries = tagHighlights(plans.slice(0, 3).map((path) => buildItinerary(path, input, hotels, budget)));
  const within = itineraries.filter((item) => item.withinBudget);
  return (within.length >= 2 ? within : itineraries).slice(0, 3);
}
