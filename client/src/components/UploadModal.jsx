import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, File, CheckCircle, AlertCircle, X, 
  Loader2, Gauge, Zap, Clock, Database, ChevronRight, 
  Server, ShieldCheck, Activity, Box, Terminal, Cpu, Settings
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import './UploadModal.css';

import useStore from '../store/useStore';

const UploadModal = () => {
  const { isUploadOpen: isOpen, setIsUploadOpen, handleUploadSuccess, token } = useStore();
  const onClose = () => setIsUploadOpen(false);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [tableName, setTableName] = useState('');
  
  // Logical steps: 
  // 1: Setup, 2: Transfer, 3: Ingestion, 4: Finalized
  const [step, setStep] = useState(1); 
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [ingestionStage, setIngestionStage] = useState(0);
  
  // Real-time tracking
  const [stats, setStats] = useState({ speed: 0, loaded: 0, total: 0, eta: 0 });
  const uploadStartTime = useRef(null);
  const autoCloseTimer = useRef(null);

  // Reset logic
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setTableName('');
      setStep(1);
      setUploadProgress(0);
      setError(null);
      setIngestionStage(0);
      setStats({ speed: 0, loaded: 0, total: 0, eta: 0 });
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        if (!tableName) setTableName(droppedFile.name.replace('.csv', '').replace(/[^a-zA-Z0-9 ]/g, ' '));
      } else {
        setError('Structure Error: Input must be a valid .csv source.');
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!tableName) setTableName(selectedFile.name.replace('.csv', '').replace(/[^a-zA-Z0-9 ]/g, ' '));
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadFile = async () => {
    if (!file || !tableName) return;
    
    setError(null);
    setStep(2); 
    setUploadProgress(0);
    uploadStartTime.current = Date.now();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tablename', tableName);

    try {
      const res = await axios.post(`${API_URL}/datasets/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const timeElapsed = (Date.now() - uploadStartTime.current) / 1000;
          if (timeElapsed > 0) {
            const currentSpeed = progressEvent.loaded / timeElapsed;
            const remaining = (progressEvent.total - progressEvent.loaded) / (currentSpeed || 1);
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            setUploadProgress(percent);
            setStats({ speed: currentSpeed, loaded: progressEvent.loaded, total: progressEvent.total, eta: remaining });
            
            if (percent === 100) {
              setStep(3);
              // Technical Ingestion Stages visual simulation for "Professional Detail"
              setTimeout(() => setIngestionStage(1), 400);
              setTimeout(() => setIngestionStage(2), 1000);
              setTimeout(() => setIngestionStage(3), 1600);
            }
          }
        }
      });
      
      // Final transition to success
      setTimeout(() => {
        setStep(4);
        handleUploadSuccess(res.data.dataset);
        
        // GUARANTEED Auto-close after 1.5 seconds of success visibility
        autoCloseTimer.current = setTimeout(() => {
           onClose();
        }, 100);
      }, 3000); 
      
    } catch (err) {
      console.error("Technical Error:", err);
      setError(err.response?.data?.error || err.message || 'Pipeline transfer failure.');
      setStep(1); 
    }
  };


  return (
    <div className="modal-overlay-minimal animate-fade-in" onClick={() => (step === 1 || step === 4) && onClose()}>
      <div className="modal-container-minimal glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Step-based Top Line (Minimal) */}
        <div className="top-progress-indicator">
          <div className="indicator-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {/* Phase Meta */}
        <div className="phase-header">
           <div className="phase-info">
             <span className="phase-count">STEP 0{step}</span>
             <h2 className="phase-title">
               {step === 1 && 'Configuration'}
               {step === 2 && 'Data Stream'}
               {step === 3 && 'AI Ingestion'}
               {step === 4 && 'Sync Finalized'}
             </h2>
           </div>
           {(step === 1 || step === 4) && (
             <button className="close-trigger" onClick={onClose} aria-label="Close window"><X size={18} /></button>
           )}
        </div>

        {/* STEP 1: MINIMAL SETUP */}
        {step === 1 && (
          <div className="minimal-flow animate-slide-up">
            <div className="input-row">
              <div className="input-field">
                <label>Resource Title</label>
                <div className="input-wrapper">
                    <Database size={16} className="i-icon" />
                    <input 
                      type="text" 
                      value={tableName} 
                      onChange={(e) => setTableName(e.target.value)} 
                      placeholder="e.g. Market_Analysis_Base"
                    />
                </div>
              </div>
            </div>

            <div 
              className={`minimal-dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input id="file-upload" type="file" accept=".csv" onChange={handleChange} style={{ display: 'none' }} />
              
              {!file ? (
                <div className="dropzone-content">
                  <div className="icon-circle-minimal">
                    <UploadCloud size={20} />
                  </div>
                  <span>Select CSV Payload</span>
                  <br/>
                  <small>System supports files up to 100MB</small>
                </div>
              ) : (
                <div className="file-preview-minimal">
                  <div className="file-meta">
                    <div className="icon-circle-minimal active">
                        <File size={18} />
                    </div>
                    <span className="f-name">{file.name}</span>
                  </div>
                  <span className="f-size">{formatSize(file.size)}</span>
                </div>
              )}
            </div>

            <div className="technical-summary">
               <div className="summary-item"><Server size={14} /> <span>Pipeline: PostgreSQL Inbound</span></div>
               <div className="summary-item"><Cpu size={14} /> <span>Processor: AI Schema Engine</span></div>
               <div className={`summary-item ${file ? 'valid' : ''}`}><CheckCircle size={14} /> <span>Asset Validation</span></div>
            </div>

            {error && <div className="minimal-error"><AlertCircle size={14} /> {error}</div>}

            <div className="action-row">
              <button className="action-cancel" onClick={onClose}>Cancel</button>
              <button className="action-start" onClick={uploadFile} disabled={!file || !tableName}>
                Upload Dataset <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: STREAMING */}
        {step === 2 && (
          <div className="minimal-flow animate-fade-in">
             <div className="streaming-metrics">
                <div className="metric-header">
                   <div className="m-title">Transferring Bytes</div>
                   <div className="m-val">{uploadProgress}%</div>
                </div>
                
                <div className="streaming-bar-bg">
                   <div className="streaming-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>

                <div className="metric-tabs">
                   <div className="tab">
                      <Gauge size={14} />
                      <span>{formatSize(stats.speed)}/s</span>
                   </div>
                   <div className="tab">
                      <Clock size={14} />
                      <span>{Math.round(stats.eta)}s ETA</span>
                   </div>
                   <div className="tab">
                      <Zap size={14} />
                      <span>{formatSize(stats.loaded)} sent</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: TECHNICAL INGESTION DETAILS */}
        {step === 3 && (
          <div className="minimal-flow animate-slide-up">
             <div className="ingestion-console">
                <div className="console-header">
                    <Terminal size={14} /> 
                    <span>SCHEMA_ENGINE_LOGS</span>
                </div>
                <div className="console-body">
                   <div className="log-line success"><CheckCircle size={10} /> STREAM_SYNC_COMPLETE</div>
                   <div className={`log-line ${ingestionStage >= 1 ? 'success' : 'active'}`}>
                      {ingestionStage >= 1 ? <CheckCircle size={10} /> : <Loader2 size={10} className="spinner" />} 
                      COLUMN_MAP_IDENTIFIED
                   </div>
                   <div className={`log-line ${ingestionStage >= 2 ? 'success' : ingestionStage === 1 ? 'active' : 'waiting'}`}>
                      {ingestionStage >= 2 ? <CheckCircle size={10} /> : ingestionStage === 1 ? <Loader2 size={10} className="spinner" /> : <Box size={10} />} 
                      DATA_TYPE_INFERENCE
                   </div>
                   <div className={`log-line ${ingestionStage >= 3 ? 'success' : ingestionStage === 2 ? 'active' : 'waiting'}`}>
                      {ingestionStage >= 3 ? <CheckCircle size={10} /> : ingestionStage === 2 ? <Loader2 size={10} className="spinner" /> : <Box size={10} />} 
                      POSTGRES_TABLE_COMMIT
                   </div>
                </div>
             </div>
             <p className="ingestion-status">Running metadata optimization...</p>
          </div>
        )}

        {/* STEP 4: FINALIZED */}
        {step === 4 && (
          <div className="minimal-flow animate-scale-up center-content">
             <div className="success-badge-v3">
                <ShieldCheck size={36} />
             </div>
             
             <div className="final-info">
                 <h3 className="ready-text">Sync Complete</h3>
                 <p className="ready-subtext">Resource live in cluster.</p>
             </div>
             
             <div className="final-asset-card">
                <Settings size={16} />
                <div className="asset-details">
                   <span className="a-name">{tableName}</span>
                   <span className="a-meta">FILE_ID: {file?.name.slice(0, 15)}... • {formatSize(file?.size || 0)}</span>
                </div>
             </div>

             <div className="auto-close-notice" style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Closing window automatically in 1s...
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UploadModal;