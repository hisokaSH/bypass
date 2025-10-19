import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLicenseKeys } from '../hooks/useLicenseKeys';
import { LogOut, Key, Calendar, Shield, Copy, CheckCircle, AlertTriangle, Clock, Settings } from 'lucide-react';
import { getDaysRemaining, isKeyExpired } from '../utils/keyGenerator';
import AdminPanel from './AdminPanel';

export default function Dashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const { keys, loading } = useLicenseKeys();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  console.log('🔍 Dashboard - isAdmin value:', isAdmin);
  console.log('🔍 Dashboard - user:', user);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (status === 'revoked') return 'text-red-600 bg-red-50 border-red-200';
    if (isKeyExpired(expiresAt)) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (status === 'active') return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status: string, expiresAt: string) => {
    if (status === 'revoked') return <AlertTriangle className="w-4 h-4" />;
    if (isKeyExpired(expiresAt)) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = (status: string, expiresAt: string) => {
    if (status === 'revoked') return 'Revoked';
    if (isKeyExpired(expiresAt)) return 'Expired';
    return 'Active';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="https://i.ibb.co/zTFs3ycs/image-2025-10-18-170600039-removebg-preview.png"
                alt="Vulcan Bypass Logo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Vulcan Bypass</h1>
                <p className="text-xs text-slate-400">License Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-slate-400">{isAdmin ? 'Admin' : 'Logged in'}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">{showAdmin ? 'User View' : 'Admin Panel'}</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAdmin && isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Your License Keys</h2>
              <p className="text-slate-400">Manage and view your Vulcan Bypass license keys</p>
            </div>

            {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No License Keys</h3>
            <p className="text-slate-400 mb-6">
              You don't have any license keys yet. Contact support to purchase a license.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {keys.map((key) => {
              const expired = isKeyExpired(key.expires_at);
              const daysRemaining = getDaysRemaining(key.expires_at);
              const statusColor = getStatusColor(key.status, key.expires_at);
              const statusIcon = getStatusIcon(key.status, key.expires_at);
              const statusText = getStatusText(key.status, key.expires_at);

              return (
                <div
                  key={key.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColor} text-sm font-medium`}>
                      {statusIcon}
                      {statusText}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-400 mb-2">License Key</label>
                    <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                      <code className="flex-1 text-sm font-mono text-white truncate">{key.key}</code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedKey === key.key ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Expires
                      </span>
                      <span className="text-white font-medium">
                        {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    </div>

                    {!expired && key.status === 'active' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Days Left
                        </span>
                        <span className="text-white font-medium">{daysRemaining} days</span>
                      </div>
                    )}

                    {key.machine_id && (
                      <div className="pt-3 border-t border-slate-700">
                        <span className="text-xs text-slate-500">Bound to device</span>
                        <p className="text-xs font-mono text-slate-400 truncate mt-1">{key.machine_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
          <h3 className="text-xl font-bold text-white mb-4">How to Use Your License Key</h3>
          <div className="space-y-4 text-slate-300">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-white">Copy your license key</p>
                <p className="text-sm text-slate-400">Click the copy button next to your key above</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-white">Launch VulcanBypass.exe</p>
                <p className="text-sm text-slate-400">Run the application on your computer</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-white">Enter your license key</p>
                <p className="text-sm text-slate-400">Paste the key when prompted to activate</p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
}