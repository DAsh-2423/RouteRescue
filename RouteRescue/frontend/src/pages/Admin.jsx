import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Map, Route, Hotel, Plus, Trash2 } from 'lucide-react';

const BLANK = {
  cities: { name: '', state: '', latitude: '', longitude: '' },
  transport: {
    from: '',
    to: '',
    mode: 'Train',
    service: '',
    departure: '',
    arrival: '',
    durationHours: '',
    distanceKm: '',
    farePerPerson: ''
  },
  hotels: { name: '', city: '', pricePerNight: '', rating: '', type: 'Budget', description: '' }
};

const COLUMNS = {
  cities: ['name', 'state', 'latitude', 'longitude'],
  transport: ['from', 'to', 'mode', 'service', 'departure', 'arrival', 'farePerPerson'],
  hotels: ['name', 'city', 'type', 'pricePerNight', 'rating'],
  users: ['name', 'email', 'phone', 'role'],
  feedback: ['rating', 'message', 'createdAt']
};

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [resource, setResource] = useState('cities');
  const [rows, setRows] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(BLANK.cities);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStats = () => api.get('/admin/dashboard').then((response) => setStats(response.data)).catch((err) => {
    setError(err.response?.data?.message || 'Admin access unavailable.');
  });

  const loadCities = () => api.get('/admin/cities').then((response) => setCities(response.data)).catch(() => {});

  const loadRows = (name = resource) => api.get(`/admin/${name}`).then((response) => setRows(response.data)).catch((err) => {
    setError(err.response?.data?.message || 'Could not load records.');
  });

  useEffect(() => {
    loadStats();
    loadCities();
  }, []);

  useEffect(() => {
    loadRows(resource);
  }, [resource]);

  function openTab(next) {
    setResource(next);
    setError('');
    setMessage('');
    setForm(BLANK[next] ? { ...BLANK[next] } : {});
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function add(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/admin/${resource}`, form);
      setMessage(resource === 'cities' ? 'City added.' : resource === 'hotels' ? 'Hotel added.' : 'Service added.');
      setForm({ ...BLANK[resource] });
      await loadRows(resource);
      await loadCities();
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add record.');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this record?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/${resource}/${id}`);
      setMessage('Record deleted.');
      await loadRows(resource);
      await loadCities();
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete record.');
    }
  }

  const columns = COLUMNS[resource] || [];
  const canEdit = resource === 'cities' || resource === 'transport' || resource === 'hotels';

  return (
    <main className="page-wrap">
      <div className="page-title">
        <span className="eyebrow">CONTROL CENTRE</span>
        <h1>Admin dashboard</h1>
        <p>Add cities, trains, buses, flights and hotels. New cities need a map latitude and longitude so journeys can use them.</p>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      {stats && (
        <div className="admin-stats">
          {[
            ['Users', stats.users, Users],
            ['Saved journeys', stats.savedJourneys, Route],
            ['Requests', stats.generatedRequests, Map],
            ['Cities', stats.cities, Map],
            ['Connections', stats.connections, Route],
            ['Hotels', stats.hotels, Hotel]
          ].map(([label, value, Icon]) => (
            <div className="stat-card" key={label}>
              <span><Icon /></span>
              <small>{label}</small>
              <b>{value}</b>
            </div>
          ))}
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-tabs">
          {['cities', 'transport', 'hotels', 'users', 'feedback'].map((tab) => (
            <button type="button" key={tab} className={resource === tab ? 'active' : ''} onClick={() => openTab(tab)}>
              {tab === 'transport' ? 'trains & buses' : tab}
            </button>
          ))}
        </div>

        {resource === 'cities' && (
          <form className="admin-form" onSubmit={add}>
            <h2>Add a city</h2>
            <Field label="City name"><input value={form.name} onChange={(event) => update('name', event.target.value)} required placeholder="Nashik" /></Field>
            <Field label="State"><input value={form.state} onChange={(event) => update('state', event.target.value)} required placeholder="Maharashtra" /></Field>
            <Field label="Latitude"><input value={form.latitude} onChange={(event) => update('latitude', event.target.value)} required inputMode="decimal" placeholder="19.9975" /></Field>
            <Field label="Longitude"><input value={form.longitude} onChange={(event) => update('longitude', event.target.value)} required inputMode="decimal" placeholder="73.7898" /></Field>
            <button className="btn btn-primary" type="submit"><Plus /> Add city</button>
          </form>
        )}

        {resource === 'transport' && (
          <form className="admin-form" onSubmit={add}>
            <h2>Add a train, bus or flight</h2>
            <Field label="From">
              <select value={form.from} onChange={(event) => update('from', event.target.value)} required>
                <option value="">Select city</option>
                {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
              </select>
            </Field>
            <Field label="To">
              <select value={form.to} onChange={(event) => update('to', event.target.value)} required>
                <option value="">Select city</option>
                {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
              </select>
            </Field>
            <Field label="Mode">
              <select value={form.mode} onChange={(event) => update('mode', event.target.value)}>
                <option>Train</option>
                <option>Bus</option>
                <option>Flight</option>
              </select>
            </Field>
            <Field label="Service name"><input value={form.service} onChange={(event) => update('service', event.target.value)} required placeholder="RR Express 900" /></Field>
            <Field label="Departure"><input type="time" value={form.departure} onChange={(event) => update('departure', event.target.value)} required /></Field>
            <Field label="Arrival"><input type="time" value={form.arrival} onChange={(event) => update('arrival', event.target.value)} required /></Field>
            <Field label="Duration (hours)"><input value={form.durationHours} onChange={(event) => update('durationHours', event.target.value)} required inputMode="decimal" placeholder="4.5" /></Field>
            <Field label="Distance (km)"><input value={form.distanceKm} onChange={(event) => update('distanceKm', event.target.value)} required inputMode="decimal" placeholder="280" /></Field>
            <Field label="Fare per person (₹)"><input value={form.farePerPerson} onChange={(event) => update('farePerPerson', event.target.value)} required inputMode="decimal" placeholder="450" /></Field>
            <button className="btn btn-primary" type="submit"><Plus /> Add service</button>
          </form>
        )}

        {resource === 'hotels' && (
          <form className="admin-form" onSubmit={add}>
            <h2>Add a hotel</h2>
            <Field label="Hotel name"><input value={form.name} onChange={(event) => update('name', event.target.value)} required placeholder="River View Inn" /></Field>
            <Field label="City">
              <select value={form.city} onChange={(event) => update('city', event.target.value)} required>
                <option value="">Select city</option>
                {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
              </select>
            </Field>
            <Field label="Price per night (₹)"><input value={form.pricePerNight} onChange={(event) => update('pricePerNight', event.target.value)} required inputMode="decimal" placeholder="1800" /></Field>
            <Field label="Rating (1 to 5)"><input value={form.rating} onChange={(event) => update('rating', event.target.value)} required inputMode="decimal" placeholder="4.2" /></Field>
            <Field label="Type">
              <select value={form.type} onChange={(event) => update('type', event.target.value)}>
                <option>Budget</option>
                <option>Standard</option>
                <option>Premium</option>
              </select>
            </Field>
            <Field label="Description"><input value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Short description" /></Field>
            <button className="btn btn-primary" type="submit"><Plus /> Add hotel</button>
          </form>
        )}

        {!canEdit && <h2>{resource === 'users' ? 'Registered users' : 'User feedback'}</h2>}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => <th key={column}>{column}</th>)}
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={columns.length + 1}>No records yet.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id || row.email}>
                  {columns.map((column) => <td key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}
                  {canEdit && (
                    <td>
                      <button type="button" className="icon-btn danger-text" onClick={() => remove(row.id)}><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}