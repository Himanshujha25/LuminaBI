import React, { useState, useEffect } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, X, ChevronDown, Database, Loader2 } from 'lucide-react';
import axios from 'axios';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [tableName, setTableName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1 = upload, 2 = success
  const [isMinimized, setIsMinimized] = useState(false);

  // If completely closed and not minimized, return null
  if (!isOpen && !isMinimized && !uploading && step !== 2) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!tableName) {
        setTableName(e.dataTransfer.files[0].name.replace('.csv', ''));
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!tableName) {
        setTableName(e.target.files[0].name.replace('.csv', ''));
      }
    }
  };

  const uploadFile = async () => {
    if (!file || !tableName) return;
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tablename', tableName);

    // Minimize modal UI immediately after starting upload!
    setIsMinimized(true);
    onClose();

    try {
      const res = await axios.post('http://localhost:5000/api/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
           setUploadProgress(percentCompleted);
        }
      });
      setStep(2);
      onUploadSuccess(res.data.dataset);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = (e) => {
    if (e) e.stopPropagation();
    if (uploading) {
        // Just hide the modal to the background if it's open but uploading
        setIsMinimized(true);
        onClose();
    } else {
        setFile(null);
        setTableName('');
        setStep(1);
        setUploadProgress(0);
        setError(null);
        setIsMinimized(false);
        onClose();
    }
  };

  const completelyReset = (e) => {
     if (e) e.stopPropagation();
     setFile(null);
     setTableName('');
     setStep(1);
     setUploadProgress(0);
     setError(null);
     setIsMinimized(false);
     onClose();
  };

  if (isMinimized) {
      return (
         <div className="bg-upload-toast glass-panel animate-slide-up" style={{ animationDuration: '0.3s' }}>
            {uploading && uploadProgress < 100 && (
               <>
                  <Loader2 className="spinner-icon" size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
                  <div className="toast-content">
                     <div className="toast-title">Uploading {tableName || 'Dataset'}</div>
                     <div className="toast-subtitle">{uploadProgress}% - You can continue using the app</div>
                  </div>
               </>
            )}
            {uploading && uploadProgress === 100 && (
               <>
                  <Database className="spinner-icon" size={20} style={{ animation: 'bounce 1s infinite', color: 'var(--accent-blue)' }} />
                  <div className="toast-content">
                     <div className="toast-title">Processing Data</div>
                     <div className="toast-subtitle">Extracting schema for {tableName || 'Dataset'}</div>
                  </div>
               </>
            )}
            {!uploading && step === 2 && (
               <>
                  <CheckCircle size={22} color="#10b981" />
                  <div className="toast-content">
                     <div className="toast-title" style={{color: '#10b981'}}>100% Uploaded</div>
                     <div className="toast-subtitle">{tableName} is indexed and ready!</div>
                  </div>
                  <button onClick={completelyReset} className="toast-close"><X size={16} /></button>
               </>
            )}
            {!uploading && error && (
               <>
                  <AlertCircle size={22} color="#ef4444" />
                  <div className="toast-content">
                     <div className="toast-title" style={{color: '#ef4444'}}>Upload Failed</div>
                     <div className="toast-subtitle">{error}</div>
                  </div>
                  <button onClick={completelyReset} className="toast-close"><X size={16} /></button>
               </>
            )}
         </div>
      );
  }

  // If not minimized, but we shouldn't show the modal
  if (!isOpen) return null;

  return (
    <div className="modal-overlay blur-backdrop animate-fade-in" onClick={resetAndClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={resetAndClose}>
          <X size={20} />
        </button>

        {step === 1 ? (
          <div className="upload-flow animate-slide-up">
            <h2 style={{ marginBottom: '8px' }}>CSV Data Upload Center</h2>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>Upload your raw data to immediately start generating AI insights.</p>
            
            <div className="input-group">
              <label>Dataset Name</label>
              <input 
                type="text" 
                value={tableName} 
                onChange={(e) => setTableName(e.target.value)} 
                placeholder="e.g. Q3_Sales_Data"
                className="premium-input"
              />
            </div>

            <div 
              className={`drag-area ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input id="file-upload" type="file" accept=".csv" onChange={handleChange} style={{ display: 'none' }} />
              
              {!file ? (
                <>
                  <div className="upload-icon-circle"><UploadCloud size={32} color="var(--accent-blue)" /></div>
                  <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Drag and drop your CSV here</h3>
                  <p className="text-tertiary">or click to browse from your computer</p>
                </>
              ) : (
                <div className="selected-file" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <File size={32} color="var(--accent-blue)" style={{ marginBottom: '12px' }}/>
                 <h3 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{file.name}</h3>
                 {!uploading ? (
                    <p className="text-secondary" style={{ marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                 ) : (
                    <div style={{ width: '80%', marginTop: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          <span>{uploadProgress === 100 ? 'Processing data...' : 'Uploading...'}</span>
                          <span>{uploadProgress < 100 ? `${(file.size * (uploadProgress/100) / 1024 / 1024).toFixed(2)} MB / ${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}</span>
                       </div>
                       <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.2s' }}></div>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', color: 'var(--text-tertiary)' }}>
                          {uploadProgress < 100 ? (
                             <>
                                <span>{uploadProgress}%</span>
                                <span>{100 - uploadProgress}% remaining</span>
                             </>
                          ) : (
                             <span style={{ margin: '0 auto', color: 'var(--accent-blue)' }}>Extracting Schema</span>
                          )}
                       </div>
                    </div>
                 )}
                </div>
              )}
            </div>

            {error && (
              <div className="upload-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={resetAndClose}>
                  {uploading ? 'Hide to Background' : 'Cancel'}
              </button>
              <button className="btn-primary" onClick={uploadFile} disabled={!file || !tableName || uploading} style={{ minWidth: '180px' }}>
                {uploading ? (
                  <><Loader2 className="spinner-icon" size={18} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> {uploadProgress === 100 ? 'Processing on Server...' : 'Uploading...'}</>
                ) : 'Background Upload'}
              </button>
            </div>
          </div>
        ) : (
          <div className="success-flow animate-slide-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="success-icon-circle" style={{ margin: '0 auto 24px auto' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2>Upload Successful!</h2>
            <p className="text-secondary" style={{ marginTop: '12px', marginBottom: '32px' }}>
              Your data has been successfully mapped and indexed. Our AI is now ready to answer your questions.
            </p>
            <button className="btn-primary" onClick={resetAndClose} style={{ width: '100%', maxWidth: '200px' }}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
