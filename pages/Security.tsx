import React, { useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';

export const Security: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('admin_username') || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage('Password too short');
      return;
    }
    
    localStorage.setItem('admin_username', currentUser);
    localStorage.setItem('admin_password', newPassword);
    
    setMessage('Credentials updated successfully');
    setNewPassword('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
        <p className="text-slate-400">Manage access credentials for the agent interface.</p>
      </header>

      <form onSubmit={handleUpdate} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Admin Access</h3>
            <p className="text-sm text-slate-400">Update the login credentials for this agent dashboard.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-emerald-400 text-sm font-medium">{message}</span>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Update Credentials
          </button>
        </div>
      </form>
    </div>
  );
};