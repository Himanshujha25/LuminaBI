import React, { useState, useEffect } from 'react';
import { X, Table, Database, Hash, Type, Calendar, ToggleLeft, Eye } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const TYPE_ICONS = {
  'TEXT': <Type size={12} />,
  'BIGINT': <Hash size={12} />,
  'INTEGER': <Hash size={12} />,
  'DOUBLE PRECISION': <Hash size={12} />,
  'NUMERIC': <Hash size={12} />,
  'TIMESTAMP': <Calendar size={12} />,
  'DATE': <Calendar size={12} />,
  'BOOLEAN': <ToggleLeft size={12} />,
};

const DatasetPreview = ({ dataset, onClose }) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    axios.get(`${API_URL}/datasets/${dataset.id}/preview`)
      .then(res => setRows(res.data || []))
      .catch(() => setError('Could not load preview.'));
  }, [dataset?.id]);

  if (!dataset) return null;

  const columns = dataset.columns || [];
  const keys = rows?.length > 0 ? Object.keys(rows[0]) : columns.map(c => c.original || c.name);
  const loading = rows === null && !error;

  return (
    <div className="modal-overlay-minimal animate-fade-in" onClick={onClose}>
      <div
        className="modal-container-minimal preview-modal-container animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95vw' }}
      >
        {/* Header bar */}
        <div className="top-progress-indicator">
          <div className="indicator-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />
        </div>

        <div className="phase-header">
          <div className="phase-info">
            <span className="phase-count"><Eye size={12} style={{ display: 'inline', marginRight: 6 }} />DATA PREVIEW</span>
            <h2 className="phase-title">{dataset.name}</h2>
          </div>
          <button className="close-trigger" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Schema pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 0 20px 0' }}>
          {columns.map(col => (
            <div key={col.name} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--surface-color)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              <span style={{ color: 'var(--accent-blue)' }}>{TYPE_ICONS[col.type] || <Database size={12} />}</span>
              {col.original || col.name}
              <span style={{ opacity: 0.5, fontSize: '10px', fontWeight: 400 }}>{col.type}</span>
            </div>
          ))}
        </div>

        {/* Data table */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border-color)', maxHeight: '380px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner-lg" style={{ margin: '0 auto 16px' }} />
              Loading preview...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No rows found in this dataset.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 1 }}>
                  {keys.map(k => (
                    <th key={k} style={{
                      padding: '12px 16px', fontWeight: 700, textAlign: 'left',
                      color: 'var(--text-tertiary)', textTransform: 'uppercase',
                      fontSize: '11px', letterSpacing: '0.5px',
                      borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap'
                    }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {keys.map(k => (
                      <td key={k} style={{
                        padding: '11px 16px', color: 'var(--text-primary)',
                        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }} title={String(row[k] ?? '')}>
                        {row[k] === null || row[k] === undefined ? <span style={{ opacity: 0.3, fontStyle: 'italic' }}>null</span> : String(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Showing up to 10 rows · {columns.length} columns</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}><Table size={12} style={{ display: 'inline', marginRight: 4 }} />{dataset.table_name}</span>
        </div>
      </div>
    </div>
  );
};

export default DatasetPreview;
