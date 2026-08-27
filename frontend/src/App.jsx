import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Network, ShieldWarning, UploadSimple, MagnifyingGlass, UserCircle, ChartLine, X } from '@phosphor-icons/react'
import NetworkGraph from './components/dashboard/graph/NetworkGraph'
import { getNetworkGraph, processUploads } from './services/api';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Search from './pages/Search';

function EntityInspector({ node, allNodes, allEdges, onClose }) {
  if (!node) return null;

  const connectedEdges = allEdges.filter(e => e.source === node.id || e.target === node.id);
  const connectedNodes = connectedEdges.map(e => {
    const connectedId = e.source === node.id ? e.target : e.source;
    const connectedNode = allNodes.find(n => n.id === connectedId);
    return {
      ...connectedNode,
      relation: e.weight > 0.8 ? 'associate' : 'linked'
    };
  }).filter(n => n !== undefined);

  const nodeRisk = node.risk || node.risk_score || 0;
  const riskColor = nodeRisk > 75 ? 'text-neonRed border-neonRed' : nodeRisk > 50 ? 'text-neonYellow border-neonYellow' : 'text-neonGreen border-neonGreen';

  return (
    <div className="absolute top-1 left-1 bottom-1 w-80 bg-[#02050A] border-r border-[#00FF41]/30 z-30 flex flex-col font-mono text-sm overflow-y-auto shadow-[4px_0_15px_rgba(0,0,0,0.5)] rounded-l-lg">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#02050A] sticky top-0 z-10">
        <span className="text-gray-400 font-bold tracking-widest text-xs">ENTITY INSPECTOR</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white flex items-center gap-1 transition-colors"><X size={16} /> Clear</button>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Header */}
        <div className="flex gap-4 items-center">
          <div className={`w-12 h-12 border rounded-sm flex items-center justify-center text-2xl font-bold bg-black/50 ${riskColor}`}>
            {node.type ? node.type.charAt(0).toUpperCase() : (node.name ? node.name.charAt(0).toUpperCase() : 'U')}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-white text-lg font-bold truncate">{node.name || 'Unknown Entity'}</h3>
            <div className="flex gap-2 mt-2 text-[10px] font-bold tracking-wider">
              <span className="text-neonCyan border border-neonCyan/30 px-1 rounded-sm bg-neonCyan/10">{node.type?.toUpperCase() || 'UNKNOWN'}</span>
              <span className={`px-1 border rounded-sm ${riskColor} ${nodeRisk > 75 ? 'bg-neonRed/10' : nodeRisk > 50 ? 'bg-neonYellow/10' : 'bg-neonGreen/10'}`}>{nodeRisk > 75 ? 'CRITICAL RISK' : nodeRisk > 50 ? 'MEDIUM RISK' : 'LOW RISK'}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="text-gray-400 text-xs flex flex-col gap-3">
          <div className="flex justify-between border-b border-gray-800 pb-2"><span>DOB</span> <span className="text-gray-200">{node.dob || 'N/A'}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span>Nationality</span> <span className="text-gray-200">{node.nationality || 'Unknown'}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span>Last Seen</span> <span className="text-gray-200">{node.last_seen || node.location || 'Unknown'}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span>Known Associates</span> <span className="text-gray-200">{connectedNodes.filter(n => n.type === 'person' || n.type === 'Person').length}</span></div>
          <div className="flex justify-between"><span>Open FIRs</span> <span className="text-gray-200">{node.open_firs || node.firs?.length || 0}</span></div>
        </div>

        {/* Connections List */}
        <div>
          <h4 className="text-gray-500 font-bold text-[10px] tracking-widest mb-3 border-b border-gray-800 pb-2">CONNECTIONS ({connectedNodes.length})</h4>
          <div className="flex flex-col gap-2">
            {connectedNodes.map((cn, i) => {
              const cnRisk = cn.risk_score || cn.risk || 0;
              return (
                <div key={i} className="border border-gray-800 bg-gray-900/30 p-3 rounded hover:border-gray-600 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-200 font-bold truncate max-w-[150px]">{cn.label || cn.name}</span>
                    <span className={`text-[10px] font-bold ${cnRisk > 75 ? 'text-neonRed' : cnRisk > 50 ? 'text-neonYellow' : 'text-neonGreen'}`}>
                      {cnRisk > 75 ? 'CRITICAL' : cnRisk > 50 ? 'HIGH' : 'MEDIUM'}
                    </span>
                  </div>
                  <div className="text-gray-500 text-[10px] flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${cn.type === 'person' ? 'bg-neonCyan' : cn.type === 'organization' ? 'bg-purple-500' : cn.type === 'location' ? 'bg-yellow-500' : cn.type === 'vehicle' ? 'bg-blue-500' : cn.type === 'financial' ? 'bg-neonRed' : 'bg-neonGreen'}`}></span>
                    → {cn.relation}
                  </div>
                </div>
              );
            })}
            {connectedNodes.length === 0 && <div className="text-gray-600 text-xs text-center py-4">No direct connections found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <header className="h-16 bg-saffron text-white flex items-center justify-between px-6 shadow-md z-10 relative">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <Network size={28} weight="bold" />
        <span className="font-montserrat font-bold text-xl tracking-wide">NETRA</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer hover:opacity-80" onClick={() => navigate('/alerts')}>
          <ShieldWarning size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-neonRed rounded-full animate-pulse-red"></span>
        </div>
        <UserCircle 
          size={28} 
          className="cursor-pointer hover:opacity-80" 
          onClick={() => alert("Secure login portal and authentication flows are coming soon!")}
        />
      </div>
    </header>
  )
}

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <Network size={20} />, path: '/' },
    { name: 'Upload', icon: <UploadSimple size={20} />, path: '/upload' },
    { name: 'Search', icon: <MagnifyingGlass size={20} />, path: '/search' },
    { name: 'Analytics', icon: <ChartLine size={20} />, path: '/analytics' },
    { name: 'Alerts', icon: <ShieldWarning size={20} />, path: '/alerts' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-[calc(100vh-64px)] fixed left-0 top-16 hidden md:block">
      <nav className="p-4 flex flex-col gap-2">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-green-50 text-indiaGreen border-l-4 border-indiaGreen' : 'text-navyBlue hover:bg-gray-50'}`}>
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      {/* Ashoka Chakra watermark */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-10 animate-[spin_60s_linear_infinite]">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" stroke="#000080" strokeWidth="4"/>
          <circle cx="50" cy="50" r="8" fill="#000080"/>
          {Array.from({length: 24}).map((_, i) => (
             <line key={i} x1="50" y1="50" x2="50" y2="2" stroke="#000080" strokeWidth="1" transform={`rotate(${i * 15} 50 50)`} />
          ))}
        </svg>
      </div>
    </aside>
  )
}

function Dashboard() {
  const location = useLocation();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [stats, setStats] = useState({ total_nodes: 0, communities: 0, high_risk: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleRunAnalysis = async () => {
    setProcessing(true);
    try {
      await processUploads();
      // Re-fetch graph data after analysis completes
      const data = await getNetworkGraph();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      const highRiskCount = (data.nodes || []).filter(n => (n.risk_score || 0) > 75).length;
      setStats({
        total_nodes: data.stats?.total_nodes || (data.nodes || []).length,
        communities: data.stats?.communities || 0,
        high_risk: highRiskCount
      });
    } catch (error) {
      console.error("Failed to run analysis:", error);
    } finally {
      setTimeout(() => setProcessing(false), 1500);
    }
  };

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const data = await getNetworkGraph();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        
        if (location.state?.searchNodeId) {
          const found = (data.nodes || []).find(n => String(n.id) === String(location.state.searchNodeId));
          if (found) setSelectedNode(found);
        }
        
        // Calculate some simple stats from the data if stats object from backend is basic
        const highRiskCount = (data.nodes || []).filter(n => (n.risk_score || 0) > 75).length;
        setStats({
          total_nodes: data.stats?.total_nodes || (data.nodes || []).length,
          communities: data.stats?.communities || 0,
          high_risk: highRiskCount
        });
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, [location.state?.searchNodeId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-navyBlue font-montserrat">Network Intelligence</h2>
        <button 
          onClick={handleRunAnalysis}
          disabled={processing}
          className="bg-indiaGreen hover:bg-[#0f6606] text-white px-4 py-2 rounded-md font-bold shadow transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Run Analysis</span>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Total Entities</p>
          <p className="text-3xl font-bold text-navyBlue mt-1">{stats.total_nodes} <span className="text-indiaGreen text-sm font-normal ml-2">Real-time</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Communities Detected</p>
          <p className="text-3xl font-bold text-navyBlue mt-1">{stats.communities}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-neonRed">
          <p className="text-gray-500 text-sm font-medium">High Risk Suspects</p>
          <p className="text-3xl font-bold text-neonRed mt-1">{stats.high_risk}</p>
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-white p-1 rounded-xl shadow-md border border-gray-200 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm">
            <div className="text-neonGreen text-xl font-bold animate-pulse">Initializing Neural Link...</div>
          </div>
        )}
        <EntityInspector 
          node={selectedNode} 
          allNodes={nodes} 
          allEdges={edges} 
          onClose={() => setSelectedNode(null)} 
        />
        <NetworkGraph 
          nodes={nodes} 
          edges={edges} 
          selectedNodeId={selectedNode?.id}
          onNodeClick={setSelectedNode} 
        />
      </div>
    </div>
  )
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <Sidebar />
      <main className="md:ml-60 pt-2 min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/search" element={<Search />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="*" element={<div className="p-8 text-center text-gray-500 mt-20">Page under construction...</div>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  )
}

export default App
