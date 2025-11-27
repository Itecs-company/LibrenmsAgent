import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff, Cpu, Server, Clock, Activity } from 'lucide-react';
import { SystemStats, AgentConfig } from '../types';

interface DashboardProps {
  stats: SystemStats;
  config: AgentConfig;
  isConnected: boolean;
}

// Mock data generator for the chart
const generateChartData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    cpu: Math.floor(Math.random() * 40) + 10,
    mem: Math.floor(Math.random() * 30) + 20,
  }));
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, config, isConnected }) => {
  const [chartData, setChartData] = useState(generateChartData());

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), {
          name: 'now',
          cpu: Math.floor(Math.random() * 40) + 10,
          mem: Math.floor(Math.random() * 30) + 20,
        }];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
        <p className="text-slate-400">Real-time metrics and agent connectivity status.</p>
      </header>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-2xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${isConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
              {isConnected ? <Wifi size={24} /> : <WifiOff size={24} />}
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">LibreNMS Connection</h3>
          <p className="text-2xl font-bold text-white mt-1">{config.agentMode === 'active' ? 'Active Push' : 'Passive Polling'}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <Cpu size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">CPU Load</h3>
          <p className="text-2xl font-bold text-white mt-1">{stats.cpuLoad}%</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-500">
              <Server size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Memory Usage</h3>
          <p className="text-2xl font-bold text-white mt-1">{stats.memoryUsage}%</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-amber-500/20 text-amber-500">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">System Uptime</h3>
          <p className="text-2xl font-bold text-white mt-1">{(stats.uptime / 3600).toFixed(1)} hrs</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            Resource Usage History
          </h3>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> CPU
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> Memory
            </span>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCpu)" 
              />
              <Area 
                type="monotone" 
                dataKey="mem" 
                stroke="#a855f7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMem)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};