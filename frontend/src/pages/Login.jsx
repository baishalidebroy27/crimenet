import React, { useState } from 'react';
import { Network, LockKey } from '@phosphor-icons/react';
import { loginAdmin } from '../services/api';

export default function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginAdmin(username, password);
      localStorage.setItem('token', data.access_token);
      setAuth(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050A] flex items-center justify-center relative overflow-hidden">
      {/* Background Grid & Ashoka Chakra */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Deeper Ashoka Chakra */}
        <div className="opacity-[0.15] animate-[spin_120s_linear_infinite]">
          <svg width="800" height="800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" stroke="#000080" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="8" fill="#000080"/>
            {Array.from({length: 24}).map((_, i) => (
               <line key={i} x1="50" y1="50" x2="50" y2="2" stroke="#000080" strokeWidth="0.5" transform={`rotate(${i * 15} 50 50)`} />
            ))}
          </svg>
        </div>
      </div>

      {/* Gradient Border Wrapper */}
      <div className="w-full max-w-md z-10 p-[2px] rounded-xl bg-gradient-to-br from-[#FF6B00] via-white to-[#00FF41] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        <div className="bg-black/95 p-8 rounded-xl backdrop-blur-xl h-full w-full flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border border-neonCyan/50 flex items-center justify-center mb-4 bg-neonCyan/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <Network size={32} className="text-neonCyan animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-montserrat text-white tracking-widest text-center">NETRA</h1>
          <p className="text-gray-400 text-xs tracking-widest mt-1">SECURE ACCESS TERMINAL</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="bg-neonRed/10 border border-neonRed text-neonRed text-sm p-3 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Operator ID</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-900 border border-gray-800 focus:border-neonCyan focus:ring-1 focus:ring-neonCyan rounded-md p-3 text-white outline-none transition-all"
              placeholder="Enter operator ID"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Passcode</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border border-gray-800 focus:border-neonCyan focus:ring-1 focus:ring-neonCyan rounded-md p-3 text-white outline-none transition-all tracking-widest"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-transparent border border-neonGreen text-neonGreen hover:bg-neonGreen/10 px-4 py-3 rounded-md font-bold shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all flex justify-center items-center gap-2 tracking-widest uppercase text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LockKey size={18} /> INITIALIZE SESSION
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED. <br/>
            ALL ACTIVITIES ARE MONITORED.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
