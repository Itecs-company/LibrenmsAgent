import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Terminal, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { LogEntry, AgentConfig } from '../types';
import { analyzeLogs } from '../services/geminiService';

interface LogAnalysisProps {
  logs: LogEntry[];
  config: AgentConfig;
}

export const LogAnalysis: React.FC<LogAnalysisProps> = ({ logs, config }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const configSummary = `Mode: ${config.agentMode}, URL: ${config.libreNmsUrl}, SNMP: ${config.snmpVersion}`;
    const result = await analyzeLogs(logs, configSummary);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle size={16} className="text-red-500" />;
      case 'warn': return <Info size={16} className="text-amber-500" />;
      default: return <CheckCircle size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
       <header className="flex justify-between items-end flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Agent Logs & Diagnostics</h2>
          <p className="text-slate-400">View system logs and use AI to troubleshoot connectivity issues.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            isAnalyzing
              ? 'bg-purple-600/50 cursor-wait text-white'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Bot size={20} />}
          {isAnalyzing ? 'Consulting Gemini...' : 'Ask AI Agent Doctor'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Logs Terminal */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Terminal size={16} className="text-slate-400" />
            <span className="text-sm font-mono text-slate-300">/var/log/librenms-agent.log</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded">
                <span className="text-slate-500 shrink-0">
                   {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="shrink-0 mt-0.5">{getIcon(log.level)}</span>
                <span className={`break-all ${
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warn' ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  [{log.category}] {log.message}
                </span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-600 italic">No logs available.</div>}
          </div>
        </div>

        {/* AI Analysis Result */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bot className="text-purple-500" size={20} />
              AI Diagnosis
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {analysisResult ? (
               <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{analysisResult}</ReactMarkdown>
               </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Click "Ask AI Agent Doctor" to analyze the current logs and configuration for potential issues.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};