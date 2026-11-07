import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form);
      nav(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Log in to compare trains, buses and flights for your next trip."
      image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=70"
      caption="Plan the whole journey, not just the next ticket."
    >
      <form onSubmit={submit}>
        <Field label="Email address">
          <input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <div className="password-wrap">
            <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={change} required placeholder="Enter your password" />
            <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button>
          </div>
        </Field>
        {error && <div className="alert error">{error}</div>}
        <button disabled={busy} className="plan-btn auth-submit" type="submit">{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="auth-switch">New to RouteRescue? <Link to="/register">Create an account</Link></p>
    </AuthFrame>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register(form);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Save journeys, compare plans and pick up a trip later."
      image="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=70"
      caption="Jaipur, Goa, Delhi and the cities in between."
    >
      <form onSubmit={submit}>
        <Field label="Full name"><input name="name" value={form.name} onChange={change} required placeholder="Your full name" /></Field>
        <Field label="Email address"><input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com" /></Field>
        <Field label="Phone number"><input name="phone" value={form.phone} onChange={change} required pattern="[0-9+ -]{8,15}" placeholder="10-digit phone number" /></Field>
        <div className="form-two">
          <Field label="Password"><input name="password" type="password" minLength="8" value={form.password} onChange={change} required placeholder="At least 8 characters" /></Field>
          <Field label="Confirm password"><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={change} required placeholder="Repeat password" /></Field>
        </div>
        {error && <div className="alert error">{error}</div>}
        <button disabled={busy} className="plan-btn auth-submit" type="submit">{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
    </AuthFrame>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function AuthFrame({ title, subtitle, image, caption, children }) {
  return (
    <main className="auth-screen" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,21,36,.72), rgba(13,21,36,.35)), url(${image})` }}>
      <section className="auth-layout">
        <div className="auth-copy">
          <Link to="/" className="site-logo footer-logo">
            <span className="site-logo-mark"><MapPin size={18} /></span>
            <span><strong>RouteRescue</strong><small>Plan smarter. Travel better.</small></span>
          </Link>
          <h1>{title}</h1>
          <p>{caption}</p>
        </div>
        <section className="auth-panel">
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
        </section>
      </section>
    </main>
  );
}