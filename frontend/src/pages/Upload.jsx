import React, { useState, useRef } from 'react';
import { UploadSimple, FileText, PhoneCall, CheckCircle, WarningCircle, ArrowRight, X, Cpu, ShieldWarning, Trash } from '@phosphor-icons/react';
import { uploadFir, uploadCdr, processUploads, clearDatabase } from '../services/api';

import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fir'); // 'fir' or 'cdr'
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error, processing
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadIds, setUploadIds] = useState([]);
  
  const inputRef = useRef(null);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
  }

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      let res;
      if (activeTab === 'fir') {
        res = await uploadFir(file, caseNumber);
      } else {
        res = await uploadCdr(file);
      }
      if (res && res.data && res.data.upload_id) {
        setUploadIds(prev => [...prev, res.data.upload_id]);
      }
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Upload failed due to network error.');
    }
  };

  const handleProcess = async () => {
    if (uploadIds.length === 0) {
        setErrorMsg('No files uploaded yet to process.');
        setStatus('error');
        return;
    }
    setStatus('processing');
    try {
      await processUploads(uploadIds);
      // Clear any previous 'viewCleared' state so the new graph displays!
      sessionStorage.removeItem('viewCleared');
      
      // Navigate directly to dashboard to see the graph
      setTimeout(() => {
          navigate('/', { state: { activeUploadIds: uploadIds } });
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Failed to trigger data processing.');
    }
  }

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to completely wipe all FIR and CDR data from the database? This cannot be undone.")) {
      try {
        await clearDatabase();
        alert("Database wiped successfully! You can now upload new data.");
      } catch (err) {
        console.error(err);
        alert("Failed to wipe database.");
      }
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto font-montserrat">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-navyBlue flex items-center gap-3">
            <UploadSimple size={32} weight="duotone" className="text-indiaGreen" />
            Data Ingestion
          </h1>
          <p className="text-gray-500 mt-2">Upload raw FIR documents and Call Detail Records (CDRs) for neural processing.</p>
        </div>
        <button 
          onClick={handleClear} 
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Trash size={20} weight="fill" /> Wipe All Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Upload Area */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-6 w-full max-w-md mx-auto lg:mx-0 shadow-inner">
            <button 
              onClick={() => {setActiveTab('fir'); clearFile();}}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm transition-all ${activeTab === 'fir' ? 'bg-white text-navyBlue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={18} /> FIR Document
            </button>
            <button 
              onClick={() => {setActiveTab('cdr'); clearFile();}}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm transition-all ${activeTab === 'cdr' ? 'bg-white text-navyBlue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PhoneCall size={18} /> Call Details (CDR)
            </button>
          </div>

          {/* Form / Dropzone */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative overflow-hidden flex-1">
            
            {/* Status Overlay */}
            {status === 'uploading' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indiaGreen border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-navyBlue font-bold animate-pulse">Encrypting & Uploading...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="absolute inset-0 bg-green-50/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <CheckCircle size={64} weight="fill" className="text-indiaGreen mb-4" />
                <h3 className="text-2xl font-bold text-indiaGreen mb-2">Upload Successful</h3>
                <p className="text-gray-600 mb-6">The {activeTab === 'fir' ? 'FIR' : 'CDR'} data has been securely vaulted.</p>
                <div className="flex gap-4">
                  <button onClick={clearFile} className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold shadow-sm hover:bg-gray-50">Upload Another</button>
                  <button onClick={handleProcess} className="px-6 py-2 bg-navyBlue text-white rounded-lg font-bold shadow-md hover:bg-navyBlue/90 flex items-center gap-2">
                    <Cpu size={20} /> Process Data Now
                  </button>
                </div>
              </div>
            )}

            {status === 'processing' && (
               <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-10 flex flex-col items-center justify-center text-neonGreen font-jetbrains">
               <Cpu size={48} className="animate-pulse mb-4 text-neonGreen" />
               <p className="tracking-widest text-lg font-bold">INITIATING PIPELINE...</p>
               <p className="text-xs opacity-70 mt-2">Parsing entities, generating graphs, calculating risk</p>
               <div className="w-48 h-1 bg-gray-800 mt-6 overflow-hidden rounded-full relative">
                 <div className="absolute top-0 h-full bg-neonGreen animate-pulse" style={{width: '100%'}}></div>
               </div>
             </div>
            )}

            <form className="h-full flex flex-col" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
              <input ref={inputRef} type="file" className="hidden" multiple={false} onChange={handleChange} />
              
              {/* Optional Case Number field for FIR */}
              {activeTab === 'fir' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-navyBlue mb-2">Case Number (Optional)</label>
                  <input 
                    type="text" 
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g. FIR-2026-0812"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indiaGreen/50 focus:border-indiaGreen transition-all"
                  />
                </div>
              )}

              {/* Drag Area */}
              <div 
                className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer ${dragActive ? 'border-indiaGreen bg-green-50' : file ? 'border-saffron bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={!file ? onButtonClick : undefined}
              >
                {!file ? (
                  <>
                    <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-gray-400">
                       <UploadSimple size={36} />
                    </div>
                    <p className="text-gray-600 font-medium text-lg mb-1 pointer-events-none">Drag and drop your file here</p>
                    <p className="text-gray-400 text-sm mb-6 pointer-events-none">Supports {activeTab === 'fir' ? 'PDF, TXT, DOCX' : 'CSV, XLSX'}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onButtonClick(); }} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-navyBlue font-bold shadow-sm hover:shadow transition-shadow">
                      Browse Files
                    </button>
                  </>
                ) : (
                  <>
                     <div className="w-16 h-16 bg-white shadow rounded-lg flex items-center justify-center mb-4 text-saffron relative cursor-default" onClick={e => e.stopPropagation()}>
                        {activeTab === 'fir' ? <FileText size={32} weight="fill" /> : <PhoneCall size={32} weight="fill" />}
                        <button type="button" onClick={(e) => {e.stopPropagation(); clearFile();}} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
                          <X size={12} weight="bold" />
                        </button>
                     </div>
                     <p className="text-navyBlue font-bold text-lg max-w-[250px] truncate cursor-default" onClick={e => e.stopPropagation()} title={file.name}>{file.name}</p>
                     <p className="text-gray-500 text-sm mt-1 cursor-default" onClick={e => e.stopPropagation()}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                )}
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex gap-3 items-center animate-pulse">
                  <WarningCircle size={24} weight="fill" />
                  <span className="font-medium text-sm">{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="button"
                onClick={handleUpload}
                disabled={!file}
                className={`mt-6 w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-md ${!file ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-navyBlue text-white hover:bg-navyBlue/90 hover:shadow-lg'}`}
              >
                Upload to Secure Vault <ArrowRight size={20} weight="bold" className={file ? "animate-pulse" : ""} />
              </button>
            </form>
          </div>
        </div>

        {/* Info / Instructions Panel */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-gradient-to-br from-navyBlue to-[#0a0a2a] p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold text-xl mb-4 text-saffron flex items-center gap-2">
              <ShieldWarning size={24} weight="fill"/> SecOps Protocol
            </h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 bg-neonGreen rounded-full shadow-neon shrink-0"></div>
                <p>All uploaded documents are immediately encrypted at rest using AES-256 standard.</p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 bg-neonGreen rounded-full shadow-neon shrink-0"></div>
                <p>The NER (Named Entity Recognition) pipeline will automatically extract suspects, locations, and assets.</p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 bg-neonYellow rounded-full shadow-neonYellow shrink-0"></div>
                <p>Ensure CDR files strictly follow the standard provider template (Jio, Airtel, Vi) to prevent parsing failures.</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h4 className="font-bold text-gray-800 mb-3">Supported Formats</h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">FIR Documents</span>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.PDF</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.TXT</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.DOCX</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Call Records</span>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.CSV</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.XLSX</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">.TXT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
