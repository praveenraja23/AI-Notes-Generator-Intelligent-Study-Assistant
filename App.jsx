import { useEffect, useState } from 'react';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';

export default function App() {
  const [auth, setAuth] = useState(api.getTokens());
  const [file, setFile] = useState(null);
  const [style, setStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (auth) loadDocuments();
  }, [auth]);

  async function loadDocuments() {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (err) {
      // non-fatal: document history just won't show
      console.error(err);
    }
  }

  function handleLogout() {
    api.clearTokens();
    setAuth(null);
    setResult(null);
    setDocuments([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a PDF, DOCX, or PPTX file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.summarize(file, style);
      setResult(data);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!auth) {
    return (
      <div style={styles.page}>
        <AuthForm onAuthenticated={setAuth} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>AI Notes Generator</h1>
            <p style={styles.subtitle}>Signed in as {auth.email}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log out
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="file"
            accept=".pdf,.docx,.pptx"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <select value={style} onChange={(e) => setStyle(e.target.value)} style={styles.select}>
            <option value="detailed">Detailed summary</option>
            <option value="short">Short summary</option>
            <option value="bullet">Bullet points</option>
            <option value="simplified">Simplified explanation</option>
          </select>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Generating summary…' : 'Generate Summary'}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.result}>
            <h2 style={styles.resultTitle}>{result.filename}</h2>
            <p style={styles.meta}>
              Style: {result.style} · Extracted {result.extractedCharacterCount.toLocaleString()} characters
            </p>
            <pre style={styles.summary}>{result.summary}</pre>
          </div>
        )}

        {documents.length > 0 && (
          <div style={styles.docsSection}>
            <h3 style={styles.docsTitle}>Your documents ({documents.length})</h3>
            <ul style={styles.docsList}>
              {documents.map((doc) => (
                <li key={doc.documentId} style={styles.docItem}>
                  <strong>{doc.filename}</strong>{' '}
                  <span style={styles.meta}>
                    ({doc.fileType}, {doc.characterCount.toLocaleString()} chars)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: { background: '#1e293b', color: '#e2e8f0', borderRadius: 12, padding: 32, maxWidth: 720, width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { margin: 0, fontSize: 24 },
  subtitle: { color: '#94a3b8', marginTop: 8 },
  logoutButton: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #334155',
    background: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  },
  form: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' },
  select: { padding: 8, borderRadius: 6 },
  button: { padding: '8px 16px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer' },
  error: { color: '#f87171', marginTop: 16 },
  result: { marginTop: 24, borderTop: '1px solid #334155', paddingTop: 16 },
  resultTitle: { margin: 0, fontSize: 18 },
  meta: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  summary: { whiteSpace: 'pre-wrap', background: '#0f172a', padding: 16, borderRadius: 8, marginTop: 12, lineHeight: 1.5 },
  docsSection: { marginTop: 32, borderTop: '1px solid #334155', paddingTop: 16 },
  docsTitle: { margin: 0, fontSize: 16 },
  docsList: { listStyle: 'none', padding: 0, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  docItem: { background: '#0f172a', padding: '8px 12px', borderRadius: 6 },
};
