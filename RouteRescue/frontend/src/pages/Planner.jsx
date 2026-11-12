
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  Wallet,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';
import api from '../services/api';
import ItineraryCard from '../components/ItineraryCard';

const today = new Date().toISOString().slice(0, 10);

const DEFAULT_FORM = {
  source: 'Mumbai',
  destination: 'Pune',
  date: today,
  travellers: 1,
  budget: 5000,
  optimization: 'balanced',
  modes: ['Train', 'Bus', 'Flight'],
  overnightStays: 0,
  accommodation: 'none'
};

// Read previously saved planner state
function getSavedPlannerState() {
  try {
    return JSON.parse(
      sessionStorage.getItem('rr_planner_state') || 'null'
    );
  } catch {
    return null;
  }
}

export default function Planner() {
  const nav = useNavigate();
  const location = useLocation();

  const [cities, setCities] = useState([]);
const [form, setForm] = useState(() => {
  const preset = location.state?.preset;
  let modes = DEFAULT_FORM.modes;
  try {
    const storedModes = JSON.parse(sessionStorage.getItem('rr_home_modes') || 'null');
    if (Array.isArray(storedModes) && storedModes.length) modes = storedModes;
  } catch { /* keep the default modes */ }
  if (preset?.source && preset?.destination) {
    sessionStorage.removeItem('rr_home_preset');
    return { ...DEFAULT_FORM, ...preset, modes };
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem('rr_home_preset') || 'null');
    if (stored?.source && stored?.destination) {
      sessionStorage.removeItem('rr_home_preset');
      return { ...DEFAULT_FORM, ...stored, modes };
    }
  } catch { /* ignore a bad preset */ }
  const saved = getSavedPlannerState();
  return saved?.form || DEFAULT_FORM;
});

  const [results, setResults] = useState(() => {
    return getSavedPlannerState()?.results || [];
  });

  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [previousPlan, setPreviousPlan] = useState(null);

  // Load available cities
  useEffect(() => {
  api.get('/cities')
    .then(r => {
      setCities(r.data);

      // Keep saved/default selections if they exist in the city list.
      setForm(previous => ({
        ...previous,
        source: r.data.some(c => c.name === previous.source)
          ? previous.source
          : r.data[0]?.name || '',
        destination: r.data.some(c => c.name === previous.destination)
          ? previous.destination
          : r.data.find(c => c.name !== previous.source)?.name || ''
      }));
    })
    .catch(() =>
      setError('Could not load city list. Is the backend running?')
    );
}, []);

  // Save form and results whenever they change
  useEffect(() => {
    sessionStorage.setItem(
      'rr_planner_state',
      JSON.stringify({ form, results })
    );
  }, [form, results]);

  // Replan loads the saved request and builds a fresh set of plans.
  useEffect(() => {
    const replan = location.state?.replan;
    if (!replan) return;

    const next = {
      ...DEFAULT_FORM,
      ...replan,
      modes: replan.modes?.length ? replan.modes : DEFAULT_FORM.modes
    };
    setForm(next);
    setPreviousPlan(location.state.previous || null);
    setResults([]);
    setError('');
    setNote('Replanning from your saved journey. Adjust any field and generate again.');
    setBusy(true);

    api.post('/journeys/plan', next)
      .then(({ data }) => {
        setResults(data.itineraries || []);
        setNote(data.message || '');
        if (!data.itineraries?.length) setError(data.message);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Journey planning failed.');
      })
      .finally(() => setBusy(false));
  }, [location.key]);

  // Update form fields
  const set = (key, value) => {
    setForm(previous => ({
      ...previous,
      [key]: value
    }));
  };

  // Toggle transport modes
  const toggle = mode => {
    set(
      'modes',
      form.modes.includes(mode)
        ? form.modes.filter(x => x !== mode)
        : [...form.modes, mode]
    );
  };

  // Generate journey plans
  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setResults([]);

    try {
      const { data } = await api.post('/journeys/plan', form);

      setResults(data.itineraries);
      setNote(data.message || '');

      if (!data.itineraries.length) {
        setError(data.message);
      }
    } catch (e) {
      setError(
        e.response?.data?.message || 'Journey planning failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  // Save a journey
  async function save(item) {
    try {
      await api.post('/journeys/save', {
        ...item,
        input: form
      });

      alert('Journey saved to your history.');
    } catch (e) {
      alert(
        e.response?.data?.message || 'Could not save journey.'
      );
    }
  }

  return (
    <main className="page-wrap">

      <div className="page-title">
        <span className="eyebrow">PLAN A JOURNEY</span>
        <h1>Where would you like to go?</h1>
        <p>
          Tell us what matters. We’ll compare complete travel
          plans, connections and stays.
        </p>
      </div>

      <form className="planner-panel" onSubmit={submit}>

        <div className="form-grid">

          <label className="field">
            <span><MapPin /> From</span>
            <select
              value={form.source}
              onChange={e => set('source', e.target.value)}
            >
              {cities.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span><MapPin /> To</span>
            <select
              value={form.destination}
              onChange={e => set('destination', e.target.value)}
            >
              {cities.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span><CalendarDays /> Journey date</span>
            <input
              type="date"
              min={today}
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span><Users /> Travellers</span>
            <input
              type="number"
              min="1"
              max="20"
              value={form.travellers}
              onChange={e => set('travellers', e.target.value)}
            />
          </label>

          <label className="field">
            <span><Wallet /> Budget per person (₹)</span>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
            />
          </label>

          

        </div>

        <div className="field-block">
          <b>Preferred transport modes</b>

          <div className="check-row">
            {['Train', 'Bus', 'Flight'].map(mode => (
              <label className="check-pill" key={mode}>
                <input
                  type="checkbox"
                  checked={form.modes.includes(mode)}
                  onChange={() => toggle(mode)}
                />
                {mode}
              </label>
            ))}
          </div>
        </div>

        <div className="form-grid">

          <label className="field">
            <span>Overnight stays</span>
            <select
              value={form.overnightStays}
              onChange={e =>
                set('overnightStays', Number(e.target.value))
              }
            >
              <option value="0">No overnight stay</option>
              <option value="1">1 night</option>
              <option value="2">2 nights</option>
              <option value="3">3 nights</option>
            </select>
          </label>

          <label className="field">
            <span>Accommodation preference</span>
            <select
              value={form.accommodation}
              onChange={e => set('accommodation', e.target.value)}
            >
              <option value="none">No accommodation</option>
              <option value="destination">At destination</option>
              <option value="intermediate">Intermediate city</option>
              <option value="flexible">Flexible location</option>
            </select>
          </label>

        </div>

        <button
          className="btn btn-primary btn-lg"
          disabled={busy || !form.modes.length}
        >
          {busy ? 'Finding routes…' : 'Generate journey options'}
        </button>

        <p className="sim-note">
          All transport times, fares and hotel availability
          are simulated sample data.
        </p>

      </form>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {note && !error && (
        <div className="alert success">{note}</div>
      )}

      {results.length > 0 && (
        <section className="results-section">

          <div className="section-heading left">
            <span className="eyebrow">YOUR OPTIONS</span>
            <h2>{results.length} journey plans found</h2>
            <p>
              Compare complete routes and save the option
              that works for you.
            </p>
          </div>

          <ComparisonTable results={results} previousPlan={previousPlan} />

          {results.map((item, i) => (
            <ItineraryCard
              key={item.id}
              item={item}
              index={i}
              onSave={save}
            />
          ))}

        </section>
      )}

    </main>
  );
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function ComparisonTable({ results, previousPlan }) {
  const rows = previousPlan ? [previousPlan, ...results] : results;

  return (
    <div className="table-scroll compare-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Total / person</th>
            <th>Group total</th>
            <th>Duration</th>
            <th>Transfers</th>
            <th>Transport</th>
            <th>Stay</th>
            <th>Hotel</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const saved = previousPlan && index === 0;
            return (
              <tr key={saved ? `saved-${item.id}` : item.id}>
                <td>
                  <b>{saved ? 'Previous plan' : (item.highlights?.join(', ') || item.name)}</b>
                  <small>{[item.source, ...(item.intermediateCities || []), item.destination].join(' → ')}</small>
                </td>
                <td>{money(item.totalPerPerson)}{item.withinBudget === false ? ' · over budget' : ''}</td>
                <td>{money(item.totalGroupCost)}</td>
                <td>{Number(item.elapsedDurationHours || 0).toFixed(1)} hrs</td>
                <td>{item.transfers}</td>
                <td>{money(item.transportationCostPerPerson)}</td>
                <td>{item.accommodation?.nights ? `${item.accommodation.city} · ${item.accommodation.nights} night(s)` : 'None'}</td>
                <td>{money(item.accommodation?.totalPerPerson)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
