import { AgentConfig, AgentMode, AuthLevel, SnmpVersion, LogEntry } from './types';

export const DEFAULT_CONFIG: AgentConfig = {
  libreNmsUrl: 'https://librenms.example.com',
  apiToken: '',
  agentMode: AgentMode.ACTIVE,
  heartbeatInterval: 60,
  snmpVersion: SnmpVersion.V2C,
  snmpPort: 161,
  communityString: 'public',
  v3User: 'librenms_user',
  v3AuthLevel: AuthLevel.AUTH_PRIV,
  v3AuthPass: '',
  v3PrivPass: '',
};

export const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 100000).toISOString(), level: 'info', category: 'SYSTEM', message: 'Agent service started successfully.' },
  { id: '2', timestamp: new Date(Date.now() - 90000).toISOString(), level: 'info', category: 'NETWORK', message: 'Detected NAT environment. Switching to Active Push mode.' },
  { id: '3', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'error', category: 'API', message: 'Failed to authenticate with LibreNMS: 401 Unauthorized.' },
  { id: '4', timestamp: new Date(Date.now() - 55000).toISOString(), level: 'warn', category: 'SNMP', message: 'SNMP Walk timed out on localhost.' },
  { id: '5', timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', category: 'API', message: 'Retrying connection to Central Server...' },
];