import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, X, Database, Loader2 } from 'lucide-react';
import axios from 'axios';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [tableName, setTableName] = useState('');
  
  // Clean, linear steps: 1 = Input, 2 = Uploading/Processing, 3 = Success
  const [step, setStep] = useState(1); 
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

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
      setFile(e.dataTransfer.files[0]);
      if (!tableName) setTableName(e.dataTransfer.files[0].name.replace('.csv', ''));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!tableName) setTableName(e.target.files[0].name.replace('.csv', ''));
    }
  };

  const uploadFile = async () => {
    if (!file || !tableName) return;
    
    setError(null);
    setStep(2); // Move strictly to the processing screen
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tablename', tableName);

    try {
      const res = await axios.post('https://luminabi.onrender.com/api/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
           setUploadProgress(percentCompleted);
        }
      });
      
      // Upload finished, move to success screen
      setStep(3);
      onUploadSuccess(res.data.dataset);
      
    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.response?.data?.error || err.message || 'An error occurred during upload.');
      setStep(1); // Kick them back to step 1 to see the error and try again
    }
  };

  const completelyReset = () => {
     setFile(null);
     setTableName('');
     setStep(1);
     setUploadProgress(0);
     setError(null);
     onClose();
  };

  return (
    <div className="modal-overlay blur-backdrop animate-fade-in" onClick={completelyReset}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Only show close button if we are NOT actively uploading */}
        {step !== 2 && (
          <button className="modal-close" onClick={completelyReset}>
            <X size={20} />
          </button>
        )}

        {/* STEP 1: Input & File Selection */}
        {step === 1 && (
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
                <div className="selected-file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <File size={32} color="var(--accent-blue)" style={{ marginBottom: '12px' }}/>
                 <h3 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{file.name}</h3>
                 <p className="text-secondary" style={{ marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
              <button className="btn-secondary" onClick={completelyReset}>Cancel</button>
              <button className="btn-primary" onClick={uploadFile} disabled={!file || !tableName}>
                Upload Data
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Dedicated Processing Screen (No blinking, highly visible) */}
        {step === 2 && (
          <div className="processing-flow animate-slide-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
             <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                {uploadProgress < 100 ? (
                  <Loader2 size={64} color="var(--accent-blue)" style={{ animation: 'spin 1.5s linear infinite' }} />
                ) : (
                  <Database size={64} color="var(--accent-blue)" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                )}
             </div>
             
             <h2 style={{ marginBottom: '12px' }}>
                {uploadProgress < 100 ? 'Uploading File...' : 'Extracting Database Schema...'}
             </h2>
             <p className="text-secondary" style={{ marginBottom: '32px' }}>
                {uploadProgress < 100 ? `Sending ${file?.name} to the server.` : 'Analyzing columns, detecting data types, and creating tables.'}
             </p>

             <div className="progress-container" style={{ width: '100%', background: 'var(--surface-hover)', borderRadius: '8px', overflow: 'hidden', height: '12px', marginBottom: '12px' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.3s ease-out' }}></div>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: '500' }}>
                <span>{uploadProgress}%</span>
                <span>Please do not close this window</span>
             </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className="success-flow animate-slide-up" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="success-icon-circle" style={{ margin: '0 auto 24px auto' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2>Upload Successful!</h2>
            <p className="text-secondary" style={{ marginTop: '12px', marginBottom: '32px' }}>
              Your data has been successfully mapped and indexed. Our AI is now ready to answer your questions.
            </p>
            <button className="btn-primary" onClick={completelyReset} style={{ width: '100%' }}>
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default UploadModal;