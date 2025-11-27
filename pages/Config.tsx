import React, { useState } from 'react';
import { Save, Radio, Server, Shield, Globe } from 'lucide-react';
import { AgentConfig, AgentMode, AuthLevel, SnmpVersion } from '../types';

interface ConfigProps {
  config: AgentConfig;
  onSave: (config: AgentConfig) => void;
}

export const Config: React.FC<ConfigProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<AgentConfig>(config);
  const [dirty, setDirty] = useState(false);

  const handleChange = (field: keyof AgentConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Agent Configuration</h2>
          <p className="text-slate-400">Configure how the agent communicates with your LibreNMS instance.</p>
        </div>
        <button
          type="submit"
          disabled={!dirty}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            dirty 
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Save size={20} />
          Save Changes
        </button>
      </header>

      {/* Connectivity Mode */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="text-emerald-500" size={20} />
          Connectivity Mode
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div 
            onClick={() => handleChange('agentMode', AgentMode.ACTIVE)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
              formData.agentMode === AgentMode.ACTIVE 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.agentMode === AgentMode.ACTIVE ? 'border-blue-500' : 'border-slate-500'}`}>
                {formData.agentMode === AgentMode.ACTIVE && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <span className="font-semibold text-white">Active Push (NAT Friendly)</span>
            </div>
            <p className="text-sm text-slate-400 ml-8">
              The agent pushes data to LibreNMS via API. Best for devices behind NAT or Firewalls.
            </p>
          </div>

          <div 
            onClick={() => handleChange('agentMode', AgentMode.PASSIVE)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
              formData.agentMode === AgentMode.PASSIVE 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.agentMode === AgentMode.PASSIVE ? 'border-blue-500' : 'border-slate-500'}`}>
                {formData.agentMode === AgentMode.PASSIVE && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <span className="font-semibold text-white">Passive (Standard)</span>
            </div>
            <p className="text-sm text-slate-400 ml-8">
              LibreNMS polls this agent via SNMP. Requires port 161/udp to be open and reachable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">LibreNMS URL</label>
            <input
              type="url"
              value={formData.libreNmsUrl}
              onChange={(e) => handleChange('libreNmsUrl', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://librenms.yourdomain.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">API Token</label>
            <input
              type="password"
              value={formData.apiToken}
              onChange={(e) => handleChange('apiToken', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="ea3f..."
            />
          </div>
        </div>
      </section>

      {/* SNMP Settings */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="text-amber-500" size={20} />
          SNMP Settings
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">SNMP Version</label>
          <div className="flex gap-4">
            {[SnmpVersion.V2C, SnmpVersion.V3].map((v) => (
               <button
               key={v}
               type="button"
               onClick={() => handleChange('snmpVersion', v)}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                 formData.snmpVersion === v
                   ? 'bg-blue-600 text-white'
                   : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
               }`}
             >
               {v === SnmpVersion.V2C ? 'v2c (Community)' : 'v3 (Secure)'}
             </button>
            ))}
          </div>
        </div>

        {formData.snmpVersion === SnmpVersion.V2C ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Community String</label>
            <input
              type="text"
              value={formData.communityString}
              onChange={(e) => handleChange('communityString', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        ) : (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">v3 User</label>
                  <input
                    type="text"
                    value={formData.v3User}
                    onChange={(e) => handleChange('v3User', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Auth Level</label>
                   <select 
                      value={formData.v3AuthLevel}
                      onChange={(e) => handleChange('v3AuthLevel', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none"
                   >
                     {Object.values(AuthLevel).map(l => (
                       <option key={l} value={l}>{l}</option>
                     ))}
                   </select>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Auth Password</label>
                  <input
                    type="password"
                    value={formData.v3AuthPass}
                    onChange={(e) => handleChange('v3AuthPass', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priv Password</label>
                  <input
                    type="password"
                    value={formData.v3PrivPass}
                    onChange={(e) => handleChange('v3PrivPass', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none"
                  />
                </div>
             </div>
          </div>
        )}
      </section>
    </form>
  );
};