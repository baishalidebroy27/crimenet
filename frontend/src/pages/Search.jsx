import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Fingerprint, Warning, Database, Lightning } from '@phosphor-icons/react';
import { getNetworkGraph } from '../services/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Fetch all nodes once to do client-side filtering for immediate feedback
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const data = await getNetworkGraph();
        setNodes(data.nodes || []);
      } catch (err) {
        console.error("Error fetching nodes for search", err);
      } finally {
        setInitialFetchDone(true);
      }
    };
    fetchNodes();
  }, []);

  // Filter nodes based on query
  const searchResults = query.trim() === '' 
    ? [] 
    : nodes.filter(node => 
        (node.label && node.label.toLowerCase().includes(query.toLowerCase())) ||
        (node.type && node.type.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto font-montserrat min-h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-10 text-center mt-10 relative z-10">
        <h1 className="text-4xl font-bold text-navyBlue flex items-center justify-center gap-3 mb-4">
          <MagnifyingGlass size={40} weight="duotone" className="text-indiaGreen" />
          Entity Search
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Query the global intelligence graph for persons of interest, organizations, locations, or phone numbers.
        </p>
      </div>

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

      {/* Results Area */}
      <div className="flex-1 relative">
        {/* Background Graphic if no search */}
        {query === '' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 opacity-50 pointer-events-none">
            <Database size={120} weight="thin" />
            <p className="mt-4 font-mono text-sm tracking-widest uppercase">Global Vault Connected</p>
            <p className="mt-1 font-mono text-xs text-gray-400">{nodes.length} Indexed Entities Available</p>
          </div>
        )}

        {/* Results List */}
        {query !== '' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max relative z-10">
            {searchResults.length > 0 ? searchResults.map((result, idx) => (
              <div 
                key={result.id || idx}
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
                <p>Try adjusting your search terms or upload more data to the intelligence vault.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
