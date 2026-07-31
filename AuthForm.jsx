import { useState } from 'react';
import { api } from '../api.js';

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(fullName, email, password);
      onAuthenticated(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{mode === 'login' ? 'Log in' : 'Create an account'}</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {mode === 'register' && (
          <input
            style={styles.input}
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      <p style={styles.switchText}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={styles.linkButton}
        >
          {mode === 'login' ? 'Register' : 'Log in'}
        </button>
      </p>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', color: '#e2e8f0', borderRadius: 12, padding: 32, maxWidth: 400, width: '100%' },
  title: { margin: 0, fontSize: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 },
  input: { padding: 10, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' },
  button: { padding: 10, borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer' },
  error: { color: '#f87171', marginTop: 12 },
  switchText: { marginTop: 16, fontSize: 14, color: '#94a3b8' },
  linkButton: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: 0, fontSize: 14 },
};
