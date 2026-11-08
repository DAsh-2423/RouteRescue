import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ArrowRight, Bus, Hotel, Plane, TrainFront, Wallet, Route } from 'lucide-react';

const CITIES = [
  'Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Vadodara', 'Delhi', 'Jaipur', 'Udaipur',
  'Indore', 'Bhopal', 'Nagpur', 'Hyderabad', 'Bengaluru', 'Chennai', 'Kolkata',
  'Lucknow', 'Prayagraj', 'Varanasi', 'Agra', 'Goa'
];

const JOURNEYS = [
  { from: 'Mumbai', to: 'Goa', meta: 'Coastal corridor · Train or bus', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=70' },
  { from: 'Delhi', to: 'Jaipur', meta: 'Pink City run · Train', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=70' },
  { from: 'Bengaluru', to: 'Chennai', meta: 'South corridor · Train', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=70' },
  { from: 'Ahmedabad', to: 'Udaipur', meta: 'Lake city hop · Bus', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=70' }
];

const DESTINATIONS = [
  { city: 'Goa', line: 'Beaches and a relaxed coastal arrival', from: 'Mumbai', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=70' },
  { city: 'Jaipur', line: 'Forts, markets and the Pink City', from: 'Delhi', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=70' },
  { city: 'Udaipur', line: 'Lakes and palace views in Rajasthan', from: 'Ahmedabad', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=70' },
  { city: 'Varanasi', line: 'Ghats on the Ganga', from: 'Delhi', image: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Boats_at_sunrise_Ganges_River_Varanasi_Uttar_Pradesh_Schwiki.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original' },
  { city: 'Agra', line: 'A short ride from Delhi', from: 'Delhi', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=70' }
];

const TOOLS = [
  { icon: Route, tone: 'blue', tag: 'Planner', title: 'Journey planner', text: 'Build a full trip with connections', to: '/planner' },
  { icon: Wallet, tone: 'amber', tag: 'Compare', title: 'Cost comparison', text: 'See cheapest, fastest and balanced', to: '/planner' },
  { icon: Hotel, tone: 'green', tag: 'Stays', title: 'Overnight stays', text: 'Hotels only when the route needs them', to: '/planner' },
  { icon: TrainFront, tone: 'red', tag: 'Modes', title: 'Train, bus, flight', text: 'Mix modes without a pointless detour', to: '/planner' },
  { icon: Bus, tone: 'violet', tag: 'History', title: 'Saved journeys', text: 'Reopen or replan a past trip', to: '/history' },
  { icon: Plane, tone: 'indigo', tag: 'Account', title: 'Travel preferences', text: 'Set budget and preferred mode', to: '/profile' }
];

function openPlanner(nav, source, destination) {
  const preset = { source, destination };
  sessionStorage.setItem('rr_home_preset', JSON.stringify(preset));
  nav('/planner', { state: { preset } });
}

export default function Home() {
  const nav = useNavigate();
  const [source, setSource] = useState('Mumbai');
  const [destination, setDestination] = useState('Goa');
  const [mode, setMode] = useState('Train');
  const [formError, setFormError] = useState('');

  function swap() {
    setSource(destination);
    setDestination(source);
  }

  function submit(event) {
    event.preventDefault();
    if (source === destination) {
      setFormError('Choose two different cities.');
      return;
    }
    setFormError('');
    sessionStorage.setItem('rr_home_modes', JSON.stringify(mode === 'Any' ? ['Train', 'Bus', 'Flight'] : [mode]));
    openPlanner(nav, source, destination);
  }

  return (
    <div className="home">
      <section className="hero-panel" id="planner-top">
        <div className="hero-card">
          <div>
            <p className="hero-kicker"><span>Smart journey planner</span><span>Train · Bus · Flight</span></p>
            <h1>Plan your perfect journey across <em>India</em></h1>
            <p className="hero-lead">Compare complete trips, not just a single ticket. See connections, travel time, overnight stays and the full cost before you go.</p>
            <div className="mode-pills">
              {['Train', 'Bus', 'Flight', 'Any'].map((item) => (
                <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
                  {item === 'Train' && <TrainFront size={15} />}
                  {item === 'Bus' && <Bus size={15} />}
                  {item === 'Flight' && <Plane size={15} />}
                  {item}
                </button>
              ))}
            </div>
            <form className="hero-search" onSubmit={submit}>
              <label>
                <span>From</span>
                <select value={source} onChange={(event) => setSource(event.target.value)}>
                  {CITIES.map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <button type="button" className="swap-btn" onClick={swap} aria-label="Swap cities"><ArrowLeftRight size={16} /></button>
              <label>
                <span>To</span>
                <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                  {CITIES.map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <button className="plan-btn" type="submit">Plan my route <ArrowRight size={16} /></button>
            </form>
            {formError && <p className="hero-error">{formError}</p>}
            <div className="stat-pills">
              <div><b>20</b><span>Sample cities</span></div>
              <div><b>3</b><span>Plans per trip</span></div>
              <div><b>₹</b><span>Clear cost split</span></div>
              <div><b>1</b><span>Place to compare</span></div>
            </div>
          </div>
          <aside className="hero-side">
            <span className="side-pill">Dedicated journey planner</span>
            <h2>Routes, stays and a cost you can check</h2>
            <p>Open the planner for ordered legs, transfer times, hotel suggestions and a side-by-side comparison.</p>
            <div className="side-grid">
              <div><TrainFront size={16} /><b>Connections</b><span>Only stops that stay on the way</span></div>
              <div><Wallet size={16} /><b>Trip cost</b><span>Fare, stay and group total</span></div>
              <div><Hotel size={16} /><b>Hotels</b><span>Shown when a night is needed</span></div>
              <div><Route size={16} /><b>Alternatives</b><span>Cheapest, fastest, balanced</span></div>
            </div>
            <Link className="open-planner" to="/planner">Open the journey planner <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="home-block">
        <div className="block-head">
          <div>
            <p className="section-kicker">Tools for the journey</p>
            <h2>Everything for one trip, in one place</h2>
          </div>
          <Link to="/planner">View planner <ArrowRight size={16} /></Link>
        </div>
        <div className="tool-grid">
          {TOOLS.map((tool) => (
            <Link key={tool.title} to={tool.to} className="tool-card">
              <span className={`tool-icon ${tool.tone}`}><tool.icon size={18} /></span>
              <small>{tool.tag}</small>
              <b>{tool.title}</b>
              <span>{tool.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="band" id="journeys">
        <div className="band-head">
          <div>
            <h2>Popular journeys</h2>
            <p>Routes travellers compare most often in this planner.</p>
          </div>
          <Link to="/planner">Explore all routes <ArrowRight size={16} /></Link>
        </div>
        <div className="journey-grid">
          {JOURNEYS.map((trip) => (
            <button key={`${trip.from}-${trip.to}`} type="button" className="journey-card" onClick={() => openPlanner(nav, trip.from, trip.to)}>
              <span className="journey-photo" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(8,15,30,.72)), url(${trip.image})` }} />
              <span className="live-tag">Sample</span>
              <strong>{trip.from} → {trip.to}</strong>
              <small>{trip.meta}</small>
              <em>Plan this journey <ArrowRight size={14} /></em>
            </button>
          ))}
        </div>
      </section>

      <section className="band band-dest" id="destinations">
        <div className="band-head">
          <div>
            <h2>Popular destinations</h2>
            <p>Pick a city and start from a sensible nearby origin.</p>
          </div>
          <a href="#planner-top">Explore destinations <ArrowRight size={16} /></a>
        </div>
        <div className="dest-grid">
          {DESTINATIONS.map((place) => (
            <button key={place.city} type="button" className="dest-card" onClick={() => openPlanner(nav, place.from, place.city)}>
              <span className="dest-photo" style={{ backgroundImage: `linear-gradient(180deg, transparent 20%, rgba(8,15,30,.78)), url(${place.image})` }} />
              <strong>{place.city}</strong>
              <small>{place.line}</small>
              <em>Plan from {place.from} <ArrowRight size={14} /></em>
            </button>
          ))}
        </div>
      </section>

      <section className="home-block prose-block">
        <h2>Why plan the whole journey here?</h2>
        <p>A ticket search only answers the next ride. RouteRescue keeps the city order on the map, then shows the train, bus or flight that actually fits that path, plus the stay and the total.</p>
        <div className="reason-grid">
          <article><b>Map-sensible stops</b><span>No detour through a city that is not on the way.</span></article>
          <article><b>Two or three plans</b><span>A cheaper ride, a faster one, and a practical balance.</span></article>
          <article><b>Costs you can add up</b><span>Each leg, the hotel, then the total for the group.</span></article>
          <article><b>Ready to save</b><span>Keep a plan and replan it when the date or budget changes.</span></article>
        </div>
      </section>

      <section className="home-block">
        <h2>Plan a trip in three steps</h2>
        <div className="step-grid">
          <article><b>1. Choose the cities</b><span>Set where you start and where you need to arrive.</span></article>
          <article><b>2. Compare the plans</b><span>Review modes, time, transfers and the rupee total.</span></article>
          <article><b>3. Save the one you want</b><span>Open it later, or replan if the trip changes.</span></article>
        </div>
      </section>
    </div>
  );
}