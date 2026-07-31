import { useState } from 'react';

const API_BASE = 'http://localhost:8080/api/notes';

export default function App() {
  const [file, setFile] = useState(null);
  const [style, setStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a PDF, DOCX, or PPTX file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('style', style);

    try {
      const response = await fetch(`${API_BASE}/summarize`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>AI Notes Generator — Vertical Slice</h1>
        <p style={styles.subtitle}>Upload a document, get an AI summary. No auth or storage yet.</p>

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
  card: {
    background: '#1e293b',
    color: '#e2e8f0',
    borderRadius: 12,
    padding: 32,
    maxWidth: 720,
    width: '100%',
  },
  title: { margin: 0, fontSize: 24 },
  subtitle: { color: '#94a3b8', marginTop: 8 },
  form: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' },
  select: { padding: 8, borderRadius: 6 },
  button: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#6366f1',
    color: 'white',
    cursor: 'pointer',
  },
  error: { color: '#f87171', marginTop: 16 },
  result: { marginTop: 24, borderTop: '1px solid #334155', paddingTop: 16 },
  resultTitle: { margin: 0, fontSize: 18 },
  meta: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  summary: {
    whiteSpace: 'pre-wrap',
    background: '#0f172a',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    lineHeight: 1.5,
  },
};
