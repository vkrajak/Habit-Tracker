import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.mark}>fn</span>
          <h1 className="display" style={{ fontSize: 28 }}>Fieldnotes</h1>
        </div>
        <p style={styles.tagline}>A quiet ledger for the habits you're tending.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input style={styles.input} value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          </label>
          <label style={styles.label}>
            Password
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          New here? <Link to="/register" style={styles.link}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: 380, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '36px 32px', boxShadow: '0 1px 2px rgba(35,38,31,0.04)' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  mark: { width: 32, height: 32, borderRadius: 8, background: 'var(--moss)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 },
  tagline: { color: 'var(--muted)', fontSize: 14, marginTop: 0, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)', fontWeight: 500 },
  input: { padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' },
  button: { marginTop: 8, padding: '11px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--moss)', color: '#fff', fontWeight: 600, fontSize: 14 },
  error: { color: 'var(--danger)', fontSize: 13, background: '#FBEAE5', padding: '8px 10px', borderRadius: 6 },
  footer: { marginTop: 22, fontSize: 13, color: 'var(--muted)', textAlign: 'center' },
  link: { color: 'var(--moss)', fontWeight: 600, textDecoration: 'none' },
};
