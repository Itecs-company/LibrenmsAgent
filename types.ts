export enum SnmpVersion {
  V2C = 'v2c',
  V3 = 'v3',
}

export enum AgentMode {
  PASSIVE = 'passive', // Server connects to Agent
  ACTIVE = 'active',   // Agent pushes to Server (NAT friendly)
}

export enum AuthLevel {
  NO_AUTH_NO_PRIV = 'noAuthNoPriv',
  AUTH_NO_PRIV = 'authNoPriv',
  AUTH_PRIV = 'authPriv',
}

export interface AgentConfig {
  libreNmsUrl: string;
  apiToken: string;
  agentMode: AgentMode;
  heartbeatInterval: number; // Seconds
  snmpVersion: SnmpVersion;
  snmpPort: number;
  // v2c
  communityString: string;
  // v3
  v3User: string;
  v3AuthLevel: AuthLevel;
  v3AuthPass: string;
  v3PrivPass: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  category: 'SNMP' | 'API' | 'SYSTEM' | 'NETWORK';
}

export interface SystemStats {
  cpuLoad: number;
  memoryUsage: number;
  uptime: number;
  lastContact: string;
}