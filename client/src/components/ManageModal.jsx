import React, { useState } from 'react';
import { Database, Trash2, X, AlertCircle } from 'lucide-react';
import './ManageModal.css';

const ManageModal = ({ isOpen, onClose, datasets, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (id) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content manage-modal glass-panel animate-scale-up" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper blue-icon">
            <Database size={24} />
          </div>
          <h2>Manage Datasets</h2>
          <p className="text-secondary">View and remove your uploaded datasets.</p>
        </div>

        <div className="datasets-list">
          {datasets.length === 0 ? (
            <div className="empty-datasets-state">
              <AlertCircle size={32} color="var(--text-tertiary)" />
              <p>No datasets uploaded yet.</p>
            </div>
          ) : (
            datasets.map((dataset) => (
              <div key={dataset.id} className="dataset-item glass-panel">
                <div className="dataset-info">
                  <span className="dataset-name">{dataset.name}</span>
                  <span className="dataset-meta text-tertiary">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(dataset.id)}
                  disabled={deletingId === dataset.id}
                  title="Delete Dataset"
                >
                  {deletingId === dataset.id ? (
                    <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#ef4444' }}></span>
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageModal;
