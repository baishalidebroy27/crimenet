import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Fingerprint, Warning, Database, FileText, PhoneCall, Trash, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { getNetworkGraph, getUploads, deleteUpload, processUploads } from '../services/api';

export default function Search() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('entities'); // 'entities' or 'vault'
  const [query, setQuery] = useState('');
  const [nodes, setNodes] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'entities') {
        const data = await getNetworkGraph();
        setNodes(data.nodes || []);
      } else {
        const data = await getUploads();
        setUploads(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching data for search", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (window.confirm("Are you sure you want to delete this file and all its generated graph data?")) {
      try {
        await deleteUpload(uploadId);
        setUploads(prev => prev.filter(u => u.upload_id !== uploadId));
        alert("Upload and its data deleted successfully.");
      } catch (err) {
        console.error("Failed to delete upload", err);
        alert("Failed to delete upload.");
      }
    }
  };

  const handleProcessUpload = async (uploadId) => {
    try {
      alert("Processing started. This might take a moment...");
      await processUploads([uploadId]);
      alert("Processing complete! The intelligence graph has been updated with entities and risk scores from this file.");
      sessionStorage.removeItem('viewCleared');
      navigate('/');
    } catch (err) {
      console.error("Failed to process upload", err);
      alert("Failed to process upload.");
    }
  };

  const searchResults = query.trim() === '' 
    ? [] 
    : nodes.filter(node => 
        (node.label && node.label.toLowerCase().includes(query.toLowerCase())) ||
        (node.type && node.type.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto font-montserrat min-h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 text-center mt-6 relative z-10">
        <h1 className="text-4xl font-bold text-navyBlue flex items-center justify-center gap-3 mb-4">
          <MagnifyingGlass size={40} weight="duotone" className="text-indiaGreen" />
          Intelligence Search
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Query the global intelligence graph or manage the historical vault of uploaded records.
        </p>
      </div>

      <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-md mx-auto mb-8 shadow-inner">
        <button 
          onClick={() => {setActiveTab('entities'); setQuery('');}}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm transition-all ${activeTab === 'entities' ? 'bg-white text-navyBlue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Fingerprint size={18} /> Entities
        </button>
        <button 
          onClick={() => {setActiveTab('vault'); setQuery('');}}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-sm transition-all ${activeTab === 'vault' ? 'bg-white text-navyBlue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Database size={18} /> Vault (Uploads)
        </button>
      </div>

      {activeTab === 'entities' ? (
        <>
          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto w-full mb-12 z-20">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlass size={24} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone number, or entity type..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-lg focus:outline-none focus:border-indiaGreen focus:ring-4 focus:ring-indiaGreen/10 transition-all font-mono"
            />
            {query && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {searchResults.length} RESULTS
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            {query === '' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 opacity-50 pointer-events-none">
                <Database size={120} weight="thin" />
                <p className="mt-4 font-mono text-sm tracking-widest uppercase">Global Vault Connected</p>
                <p className="mt-1 font-mono text-xs text-gray-400">{nodes.length} Indexed Entities Available</p>
              </div>
            )}

            {query !== '' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max relative z-10">
                {searchResults.length > 0 ? searchResults.map((result, idx) => (
                  <div 
                    key={result.id || idx}
                    onClick={() => navigate('/', { state: { searchNodeId: result.id } })}
                    className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-indiaGreen transition-all group cursor-pointer flex gap-4 items-start"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      (result.risk_score || 0) > 75 ? 'bg-red-50 text-neonRed' : 
                      (result.risk_score || 0) > 50 ? 'bg-orange-50 text-saffron' : 
                      'bg-green-50 text-indiaGreen'
                    }`}>
                      <Fingerprint size={28} weight="duotone" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-navyBlue truncate" title={result.label}>{result.label}</h3>
                        {(result.risk_score || 0) > 0 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            result.risk_score > 75 ? 'bg-red-100 text-neonRed' : 
                            result.risk_score > 50 ? 'bg-orange-100 text-saffron' : 
                            'bg-green-100 text-indiaGreen'
                          }`}>
                            <Warning size={12} weight="fill" />
                            {result.risk_score}% RISK
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-navyBlue px-2 py-0.5 rounded-sm">
                          {result.type || 'UNKNOWN'}
                        </span>
                        <span className="text-xs font-mono text-gray-500">ID: {result.id}</span>
                      </div>
                      
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
                        <div 
                          className={`h-full ${result.risk_score > 75 ? 'bg-neonRed' : result.risk_score > 50 ? 'bg-saffron' : 'bg-indiaGreen'}`} 
                          style={{ width: `${result.risk_score || 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-1 md:col-span-2 py-12 text-center text-gray-500">
                    <p className="text-lg font-bold mb-2 text-navyBlue">No entities found.</p>
                    <p>Try adjusting your search terms.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 max-w-4xl mx-auto w-full">
          {loading ? (
             <div className="text-center py-10 text-gray-500 font-mono animate-pulse">Loading vault records...</div>
          ) : uploads.length > 0 ? (
            <div className="flex flex-col gap-4">
              {uploads.map((upload) => (
                <div key={upload.upload_id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 overflow-hidden">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                      {upload.file_type === 'fir' ? <FileText size={24} weight="duotone" /> : <PhoneCall size={24} weight="duotone" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-md font-bold text-navyBlue truncate" title={upload.filename}>{upload.filename}</h3>
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 font-mono">
                          <span>{upload.case_number ? `Case: ${upload.case_number}` : `ID: ${upload.upload_id}`}</span>
                          <span>{new Date(upload.uploaded_at).toLocaleString()}</span>
                          <span>{(upload.file_size_bytes / 1024).toFixed(1)} KB</span>
                       </div>
                       
                       {upload.blockchain_verified && (
                         <div className="mt-3 flex items-start gap-2 bg-green-50/50 p-2 rounded border border-green-100">
                           <ShieldCheck size={16} weight="fill" className="text-indiaGreen shrink-0 mt-0.5" />
                           <div className="min-w-0">
                              <p className="text-[10px] font-bold text-indiaGreen uppercase tracking-wider">Blockchain Verified</p>
                              <div className="flex items-center gap-2 mt-1">
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${upload.blockchain_tx_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-500 hover:text-blue-700 font-mono truncate block transition-colors max-w-[150px] md:max-w-[200px]"
                                  title="View Transaction on Etherscan"
                                >
                                  Tx: {upload.blockchain_tx_id}
                                </a>
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${upload.blockchain_tx_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-indiaGreen text-white rounded text-[10px] font-bold shadow-sm hover:bg-green-700 hover:shadow transition-all shrink-0"
                                >
                                  Verify Hash
                                </a>
                              </div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => handleProcessUpload(upload.upload_id)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Process this upload into the intelligence graph"
                    >
                      <Database size={16} weight="bold" /> Process
                    </button>
                    <button 
                      onClick={() => handleDeleteUpload(upload.upload_id)}
                      className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Delete this upload and its graph data"
                    >
                      <Trash size={16} weight="bold" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold text-navyBlue mb-2">Vault is Empty</p>
              <p>No historical uploads found in the system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
