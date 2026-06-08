import { useState, useEffect } from 'react';
import GlobalSystemBar from './GlobalSystemBar';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import QuantumTeleportLab from './QuantumTeleportLab';
import AlgorithmicSubsidy from './AlgorithmicSubsidy';
import EquityTipEngine from './EquityTipEngine';
import SpiteCrewRoster from './SpiteCrewRoster';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [osTheme, setOsTheme] = useState(() => localStorage.getItem('sovereign_theme') || 'spiteslice');

  useEffect(() => {
    const handleThemeChange = () => {
      setOsTheme(localStorage.getItem('sovereign_theme') || 'spiteslice');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  return (
    <div className={`relative flex h-screen w-full bg-[#0E0B0B] overflow-hidden selection:bg-red-500 selection:text-white theme-${osTheme}`}>
      {/* Background neon lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/5 blur-[150px] rounded-full"></div>
      </div>

      <GlobalSystemBar osTheme={osTheme} setOsTheme={setOsTheme} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 h-screen overflow-y-auto pt-24 px-8 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'teleport' && <QuantumTeleportLab />}
          {activeTab === 'subsidy' && <AlgorithmicSubsidy />}
          {activeTab === 'tip' && <EquityTipEngine />}
          {activeTab === 'crew' && <SpiteCrewRoster />}
        </div>
      </main>
    </div>
  );
}
