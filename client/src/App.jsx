import React, { useState } from 'react';
import axios from 'axios';
import { 
  Send, TreePine, AlertTriangle, Database, 
  User, Copy, Check, Server, Terminal, Share2
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

const EXAMPLES = [
  { id: 1, label: 'Standard Tree', data: 'A->B, A->C, B->D, C->E' },
  { id: 2, label: 'Deep Hierarchy', data: 'A->B, B->C, C->D, D->E, E->F' },
  { id: 3, label: 'Circular Graph', data: 'X->Y, Y->Z, Z->X' },
  { id: 4, label: 'Diamond Case', data: 'A->B, A->C, B->D, C->D' },
];

const RecursiveNode = ({ node, children }) => {
  const keys = Object.keys(children);
  return (
    <div className="node">
      <div className="node-content">
        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span> {node}
      </div>
      {keys.length > 0 && (
        <div className="tree-container">
          {keys.map(key => (
            <RecursiveNode key={key} node={key} children={children[key]} />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [input, setInput] = useState(EXAMPLES[0].data);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeExample, setActiveExample] = useState(EXAMPLES[0].id);

  const processData = async () => {
    setLoading(true);
    setError('');
    setSelectedIndex(null); // Reset selection on new process
    
    try {
      const data = input.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
      const res = await axios.post(`${API_BASE_URL}/bfhl`, { data });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="app-wrapper">
      <header>
        <h1>BFHL <span style={{ color: 'var(--primary)' }}>Challenge</span></h1>
        <p>Advanced Hierarchy Analytics & Tree Visualization</p>
      </header>

      <main className="main-container">
        {/* Input Section */}
        <section className="input-card animate">
          <div className="example-container">
            {EXAMPLES.map(ex => (
              <div 
                key={ex.id} 
                className={`example-chip ${activeExample === ex.id ? 'selected' : ''}`} 
                onClick={() => {
                  setInput(ex.data);
                  setActiveExample(ex.id);
                }}
              >
                {ex.label}
              </div>
            ))}
          </div>
          <div className="textarea-wrapper">
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="A->B, B->C..."
            />
          </div>
          <button className="btn-primary" onClick={processData} disabled={loading}>
            {loading ? <div className="loader"></div> : <><Send size={18} /> Process Data</>}
          </button>
          {error && <p style={{ color: 'var(--accent-error)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        </section>

        {response && (
          <div className="results-grid animate">
            {/* Visualizer Panel */}
            <section className="panel">
              <h2><TreePine size={24} color="var(--primary)" /> Hierarchy Explorer</h2>
              <div className="hierarchy-stack">
                {response.hierarchies.map((h, i) => (
                  <div 
                    key={i} 
                    className={`hierarchy-item ${selectedIndex === i ? 'selected' : ''}`}
                    onClick={() => setSelectedIndex(i)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <div className="h-top">
                      <span className="badge badge-primary">Root: {h.root}</span>
                      {h.has_cycle ? (
                        <span className="badge badge-error">Cycle Detected</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Depth: {h.depth}</span>
                      )}
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      {h.has_cycle ? (
                        <p style={{ color: 'var(--accent-error)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          Visualization disabled for cyclic groups.
                        </p>
                      ) : (
                        <RecursiveNode node={h.root} children={h.tree[h.root]} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={copyJson}
                style={{ 
                  marginTop: '1.5rem', background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--glass-border)', padding: '0.6rem 1rem', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem'
                }}>
                {copySuccess ? <Check size={16} color="var(--accent-success)" /> : <Copy size={16} />}
                {copySuccess ? 'Copied to clipboard' : 'Export JSON Response'}
              </button>
            </section>

            {/* Stats & Identity Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="panel">
                <h2><Database size={24} color="var(--accent-success)" /> Analytics</h2>
                <div className="stat-box"><span>Non-Cyclic Trees</span><span className="stat-val">{response.summary.total_trees}</span></div>
                <div className="stat-box"><span>Cyclic Clusters</span><span className="stat-val">{response.summary.total_cycles}</span></div>
                <div className="stat-box"><span>Largest Root</span><span className="stat-val">{response.summary.largest_tree_root || 'N/A'}</span></div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="log-box">
                    <div className="log-label"><Terminal size={12} /> Invalid Entries</div>
                    <div className="log-data" style={{ color: 'var(--accent-error)' }}>
                      {response.invalid_entries.length > 0 ? response.invalid_entries.join(', ') : 'None'}
                    </div>
                  </div>
                  <div className="log-box">
                    <div className="log-label"><Share2 size={12} /> Duplicates Filtered</div>
                    <div className="log-data" style={{ color: 'var(--accent-warning)' }}>
                      {response.duplicate_edges.length > 0 ? response.duplicate_edges.join(', ') : 'None'}
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel" style={{ background: 'white' }}>
                <h2><User size={24} color="var(--primary)" /> Student Identity</h2>
                <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="log-label">User ID</span>
                  <span style={{ fontWeight: '600' }}>{response.user_id}</span>
                </div>
                <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="log-label">Email</span>
                  <span style={{ fontWeight: '600' }}>{response.email_id}</span>
                </div>
                <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="log-label">Roll Number</span>
                  <span style={{ fontWeight: '600' }}>{response.college_roll_number}</span>
                </div>
              </section>

              <section className="panel" style={{ border: '1px dashed var(--glass-border)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                  <Server size={18} />
                  <span style={{ fontSize: '0.85rem' }}>API Backend: <span style={{ color: 'var(--accent-success)' }}>Connected</span></span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
