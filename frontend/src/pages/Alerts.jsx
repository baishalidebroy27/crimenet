import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldWarning, BellRinging, Eye, Siren, MapPin, Clock } from '@phosphor-icons/react';
import { getNetworkGraph } from '../services/api';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getNetworkGraph();
        const nodes = data.nodes || [];
        
        // Dynamically generate alerts based on actual data
        const generatedAlerts = [];
        
        nodes.forEach((node, idx) => {
          const risk = node.risk_score || 0;
          if (risk > 80) {
            generatedAlerts.push({
              id: `crit-${node.id}`,
              type: 'CRITICAL',
              title: 'High-Risk Entity Detected',
              desc: `Entity "${node.label}" flagged with ${risk}% threat score.`,
              time: 'Recent',
              loc: node.type || 'Unknown',
              active: true
            });
          } else if (risk > 50) {
            generatedAlerts.push({
              id: `warn-${node.id}`,
              type: 'WARNING',
              title: 'Elevated Risk Level',
              desc: `Entity "${node.label}" crossed risk threshold (${risk}%).`,
              time: 'Recent',
              loc: node.type || 'Unknown',
              active: false
            });
          }
        });
        
        // If no alerts generated from data yet, show empty state instead of mock
        setAlerts(generatedAlerts);
      } catch (err) {
        console.error("Error fetching graph data for alerts", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, []);

  const handleDismiss = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const activeCount = alerts.filter(a => a.active).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto font-montserrat">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-navyBlue flex items-center gap-3">
            <ShieldWarning size={32} weight="duotone" className="text-neonRed" />
            Threat Alerts
          </h1>
          <p className="text-gray-500 mt-2">Real-time anomaly detection and security triggers based on your vault.</p>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-neonRed px-4 py-2 rounded-lg font-bold border border-red-100 shadow-sm">
            <Siren size={20} className="animate-pulse-red" />
            <span>{activeCount} Active Threats</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-neonRed rounded-full animate-spin"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          <BellRinging size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-lg font-bold mb-1">No Active Alerts</h3>
          <p>Your network is currently secure. Upload more data to scan for anomalies.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-5 rounded-xl border-l-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:shadow-md ${
                alert.type === 'CRITICAL' 
                  ? 'bg-white border-l-neonRed' 
                  : alert.type === 'WARNING' 
                    ? 'bg-white border-l-saffron' 
                    : 'bg-gray-50 border-l-gray-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  alert.type === 'CRITICAL' 
                    ? 'bg-red-100 text-neonRed' 
                    : alert.type === 'WARNING' 
                      ? 'bg-orange-100 text-saffron' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {alert.type === 'CRITICAL' ? <Siren size={20} weight="fill" /> : alert.type === 'WARNING' ? <Warning size={20} weight="fill" /> : <BellRinging size={20} weight="fill" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-navyBlue text-lg">{alert.title}</h3>
                    {alert.active && <span className="px-2 py-0.5 bg-red-100 text-neonRed text-[10px] font-bold rounded animate-pulse">NEW</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{alert.desc}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Clock size={14} /> {alert.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> Entity Type: {alert.loc}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button onClick={() => handleDismiss(alert.id)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-navyBlue bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Dismiss</button>
                <button onClick={() => navigate('/search')} className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors ${
                   alert.type === 'CRITICAL' ? 'bg-neonRed hover:bg-red-700' : 'bg-navyBlue hover:bg-navyBlue/90'
                }`}>
                  <Eye size={16} /> Investigate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
