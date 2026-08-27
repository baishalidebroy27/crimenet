import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartLine, Users, Target, Warning, Brain, Lightning } from '@phosphor-icons/react';
import { getNetworkGraph } from '../services/api';

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const handleClearView = () => {
    setNodes([]);
    setEdges([]);
    sessionStorage.setItem('viewCleared', 'true');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (sessionStorage.getItem('viewCleared') === 'true') {
        setLoading(false);
        return;
      }
      try {
        const data = await getNetworkGraph();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        console.error("Error fetching analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate dynamic metrics
  const highRiskNodes = nodes.filter(n => (n.risk_score || 0) >= 50);
  const averageRisk = nodes.length > 0 ? (nodes.reduce((acc, n) => acc + (n.risk_score || 0), 0) / nodes.length).toFixed(1) : 0;
  const uniqueTypes = new Set(nodes.map(n => n.type)).size;
  
  // Sort nodes by risk score for Top Suspects
  const topSuspects = [...nodes].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-montserrat">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-navyBlue flex items-center gap-3">
            <ChartLine size={32} weight="duotone" className="text-saffron" />
            Neural Analytics
          </h1>
          <p className="text-gray-500 mt-2">Deep learning insights, graph algorithms, and pattern recognition metrics.</p>
        </div>
        <button 
          onClick={handleClearView}
          className="bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-md font-bold shadow-sm transition-all flex items-center gap-2"
        >
          Clear View
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold animate-pulse">Running Graph Algorithms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Metric Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Brain size={24} weight="fill"/>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Entities</p>
                  <p className="text-2xl font-bold text-navyBlue mt-1">{nodes.length}</p>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <Users size={24} weight="fill"/>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Entity Types</p>
                  <p className="text-2xl font-bold text-navyBlue mt-1">{uniqueTypes || 0}</p>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-indiaGreen">
                  <Target size={24} weight="fill"/>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Known Targets</p>
                  <p className="text-2xl font-bold text-navyBlue mt-1">{highRiskNodes.length}</p>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-b-4 border-b-neonRed">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-neonRed">
                  <Warning size={24} weight="fill"/>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Network Risk</p>
                  <p className="text-2xl font-bold text-neonRed mt-1">{averageRisk}%</p>
                </div>
             </div>
          </div>

          {/* Top Suspects List */}
          <div className="lg:col-span-3 bg-gradient-to-b from-navyBlue to-[#0a0a2a] rounded-xl shadow-lg border border-gray-800 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lightning size={120} />
            </div>
            <h3 className="font-bold text-saffron mb-6 relative z-10 flex items-center gap-2">
              <Target size={20} /> High-Value Targets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {topSuspects.length > 0 ? topSuspects.map((target, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300">
                      #{idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-base text-gray-100 truncate max-w-[180px]" title={target.label}>{target.label}</p>
                      <p className="text-[10px] text-neonCyan tracking-wider uppercase mt-1">{target.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${(target.risk_score || 0) > 90 ? 'text-neonRed' : (target.risk_score || 0) > 50 ? 'text-neonYellow' : 'text-neonGreen'}`}>{target.risk_score || 0}%</span>
                    <p className="text-[10px] text-gray-400 tracking-wider">RISK</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-gray-400 text-sm text-center py-10 border border-dashed border-gray-700 rounded-lg">
                  No targets identified yet. Upload data to populate.
                </div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/search')}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold tracking-widest rounded transition-colors"
            >
              VIEW FULL DOSSIER
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
