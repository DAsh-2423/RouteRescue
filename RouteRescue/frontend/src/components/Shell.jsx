import { Link, useNavigate } from 'react-router-dom';
import { MapPin, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="site-nav">
      <Link to="/" className="site-logo">
        <span className="site-logo-mark"><MapPin size={18} /></span>
        <span>
          <strong>RouteRescue</strong>
          <small>Plan smarter. Travel better.</small>
        </span>
      </Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/planner">Planner</Link>
        <a href="/#journeys">Popular journeys</a>
        <a href="/#destinations">Destinations</a>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Link to="/history">My journeys</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      </nav>
      <div className="site-nav-actions">
        {user ? (
          <>
            <span className="user-chip"><UserRound size={15} />{user.name.split(' ')[0]}</span>
            <button className="site-login" type="button" onClick={() => { logout(); nav('/'); }}>
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <Link className="site-login" to="/login">Login / Sign up</Link>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <div className="site-logo footer-logo">
            <span className="site-logo-mark"><MapPin size={18} /></span>
            <span>
              <strong>RouteRescue</strong>
              <small>Plan smarter. Travel better.</small>
            </span>
          </div>
          <p>Compare trains, buses and flights, then build a complete journey with stops, stays and a clear cost.</p>
        </div>
        <div>
          <h3>Plan your trip</h3>
          <Link to="/planner">Journey planner</Link>
          <a href="/#journeys">Popular journeys</a>
          <a href="/#destinations">Popular destinations</a>
          <Link to="/history">Saved journeys</Link>
        </div>
        <div>
          <h3>Travel tools</h3>
          <Link to="/planner">Cheapest, fastest and balanced</Link>
          <Link to="/planner">Overnight stays</Link>
          <Link to="/feedback">Share feedback</Link>
          <Link to="/profile">Travel preferences</Link>
        </div>
        <div>
          <h3>Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Create account</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
      <div className="site-footer-bottom">© 2026 RouteRescue. Sample schedules and fares are simulated for this working model.</div>
    </footer>
  );
}

export function AppLayout({ children }) {
  return (
    <div className="site-shell">
      <Navbar />
      <div className="site-main">{children}</div>
      <Footer />
    </div>
  );
}