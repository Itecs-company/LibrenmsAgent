import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Config } from './pages/Config';
import { LogAnalysis } from './pages/LogAnalysis';
import { Login } from './pages/Login';
import { Security } from './pages/Security';
import { AgentConfig, SystemStats, LogEntry } from './types';
import { DEFAULT_CONFIG, MOCK_LOGS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  
  // Mock State
  const [stats, setStats] = useState<SystemStats>({
    cpuLoad: 15,
    memoryUsage: 42,
    uptime: 12345,
    lastContact: new Date().toISOString(),
  });
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);

  // Load auth state from session storage for simple persistence across refreshes
  useEffect(() => {
    const auth = sessionStorage.getItem('auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Simulator for system stats
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
       setStats(prev => ({
         ...prev,
         cpuLoad: Math.floor(Math.random() * 30) + 10,
         uptime: prev.uptime + 5,
         lastContact: new Date().toISOString()
       }));
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = (status: boolean) => {
    setIsAuthenticated(status);
    if (status) sessionStorage.setItem('auth', 'true');
    else sessionStorage.removeItem('auth');
  };

  const handleLogout = () => {
    handleLogin(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} config={config} isConnected={config.agentMode === 'active'} />;
      case 'configuration':
        return <Config config={config} onSave={setConfig} />;
      case 'logs':
        return <LogAnalysis logs={logs} config={config} />;
      case 'security':
        return <Security />;
      default:
        return <Dashboard stats={stats} config={config} isConnected={true} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;