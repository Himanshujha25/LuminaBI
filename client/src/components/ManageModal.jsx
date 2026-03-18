import React, { useState } from 'react';
import { Database, Trash2, X, AlertCircle, Calendar, Table, Activity, ChevronRight, HardDrive } from 'lucide-react';
import './ManageModal.css';

import useStore from '../store/useStore';

const ManageModal = () => {
  const { isManageOpen: isOpen, setIsManageOpen, datasets, handleDeleteDataset: onDelete } = useStore();
  const onClose = () => setIsManageOpen(false);

  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (id) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };


  return (
    <div className="modal-overlay-minimal animate-fade-in" onClick={onClose}>
      <div className="modal-container-minimal manage-premium-container animate-scale-up" onClick={e => e.stopPropagation()}>
        
        <div className="top-progress-indicator">
          <div className="indicator-fill" style={{ width: '100%' }}></div>
        </div>

        <div className="phase-header">
           <div className="phase-info">
             <span className="phase-count">SYSTEM ASSETS</span>
             <h2 className="phase-title">Manage Cluster</h2>
           </div>
           <button className="close-trigger" onClick={onClose} aria-label="Close window">
             <X size={18} />
           </button>
        </div>

        <div className="datasets-grid-container custom-scrollbar">
          {datasets.length === 0 ? (
            <div className="empty-assets-state animate-slide-up">
              <div className="icon-circle-minimal">
                <AlertCircle size={24} />
              </div>
              <h3>No Assets Found</h3>
              <p>Your data cluster is currently empty. Upload a CSV to begin analysis.</p>
            </div>
          ) : (
            <div className="premium-grid">
              {datasets.map((dataset) => (
                <div 
                  key={dataset.id} 
                  className={`asset-card-premium ${hoveredId === dataset.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredId(dataset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="asset-card-header">
                    <div className="asset-icon-box">
                      <Table size={18} />
                    </div>
                    <button 
                      className={`asset-delete-trigger ${deletingId === dataset.id ? 'deleting' : ''}`}
                      onClick={() => handleDelete(dataset.id)}
                      disabled={deletingId === dataset.id}
                      title="Purge Dataset"
                    >
                      {deletingId === dataset.id ? (
                        <Activity size={16} className="spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  <div className="asset-card-body">
                    <h4 className="asset-title">{dataset.name}</h4>
                    <div className="asset-meta-tags">
                      <div className="meta-tag">
                        <Calendar size={10} />
                        <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="meta-tag">
                        <HardDrive size={10} />
                        <span>POSTGRES_DB</span>
                      </div>
                    </div>
                  </div>

                  <div className="asset-card-footer">
                    <div className="asset-id-code">
                      ID: {dataset.table_name?.slice(3, 15)}...
                    </div>
                    <ChevronRight size={14} className="arrow-icon" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="manage-footer-summary">
          <div className="total-indicator">
             <span>ACTIVE_DATASETS:</span>
             <strong>{String(datasets.length).padStart(2, '0')}</strong>
          </div>
          <p className="footer-note">Unlinking a dataset permanently drops its cluster table.</p>
        </div>
      </div>
    </div>
  );
};

export default ManageModal;
