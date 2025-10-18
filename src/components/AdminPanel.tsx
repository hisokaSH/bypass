import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateLicenseKey } from '../utils/keyGenerator';
import { Plus, Trash2, Clock, Ban, RefreshCw, Search, Users, Key as KeyIcon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface LicenseKey {
  id: string;
  user_id: string;
  key: string;
  status: string;
  expires_at: string;
  created_at: string;
  machine_id: string | null;
  user_profiles?: {
    username: string;
    email: string;
  };
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [allKeys, setAllKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [daysValid, setDaysValid] = useState(30);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('keys');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, keysRes] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('license_keys')
          .select('*, user_profiles(username, email)')
          .order('created_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (keysRes.error) throw keysRes.error;

      setUsers(usersRes.data || []);
      setAllKeys(keysRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    setCreating(true);
    try {
      const newKey = generateLicenseKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysValid);

      const { error } = await supabase.from('license_keys').insert({
        user_id: selectedUser,
        key: newKey,
        status: 'active',
        expires_at: expiresAt.toISOString()
      });

      if (error) throw error;

      await loadData();
      setSelectedUser('');
      alert('License key created successfully!');
    } catch (error) {
      console.error('Error creating key:', error);
      alert('Failed to create license key');
    } finally {
      setCreating(false);
    }
  };

  const updateKeyStatus = async (keyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('license_keys')
        .update({ status: newStatus })
        .eq('id', keyId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating key:', error);
      alert('Failed to update key status');
    }
  };

  const extendKey = async (keyId: string, days: number) => {
    try {
      const key = allKeys.find(k => k.id === keyId);
      if (!key) return;

      const newExpiry = new Date(key.expires_at);
      newExpiry.setDate(newExpiry.getDate() + days);

      const { error } = await supabase
        .from('license_keys')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', keyId);

      if (error) throw error;
      await loadData();
      alert(`Key extended by ${days} days`);
    } catch (error) {
      console.error('Error extending key:', error);
      alert('Failed to extend key');
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this key? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('license_keys').delete().eq('id', keyId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting key:', error);
      alert('Failed to delete key');
    }
  };

  const filteredKeys = allKeys.filter(key => {
    const searchLower = searchTerm.toLowerCase();
    return (
      key.key.toLowerCase().includes(searchLower) ||
      key.user_profiles?.username?.toLowerCase().includes(searchLower) ||
      key.user_profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'keys'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <KeyIcon className="w-4 h-4" />
            Manage Keys
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            View Users
          </button>
        </div>

        {activeTab === 'keys' && (
          <>
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Create New License Key</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Valid for (days)</label>
                  <input
                    type="number"
                    value={daysValid}
                    onChange={(e) => setDaysValid(parseInt(e.target.value) || 30)}
                    min="1"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createKey}
                    disabled={creating || !selectedUser}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search keys by key, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">All License Keys ({filteredKeys.length})</h3>
              <div className="space-y-3">
                {filteredKeys.map(key => (
                  <div
                    key={key.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono text-white bg-slate-800 px-2 py-1 rounded">
                            {key.key}
                          </code>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            key.status === 'active' ? 'bg-green-900/50 text-green-400' :
                            key.status === 'revoked' ? 'bg-red-900/50 text-red-400' :
                            'bg-gray-900/50 text-gray-400'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          <p>User: <span className="text-slate-300">{key.user_profiles?.username || key.user_profiles?.email}</span></p>
                          <p>Expires: <span className="text-slate-300">{new Date(key.expires_at).toLocaleDateString()}</span></p>
                          {key.machine_id && (
                            <p className="truncate">Device: <span className="text-slate-300 font-mono text-xs">{key.machine_id}</span></p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {key.status === 'active' && (
                          <>
                            <button
                              onClick={() => extendKey(key.id, 30)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                              title="Extend 30 days"
                            >
                              <Clock className="w-3 h-3" />
                              +30d
                            </button>
                            <button
                              onClick={() => updateKeyStatus(key.id, 'revoked')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                              title="Revoke key"
                            >
                              <Ban className="w-3 h-3" />
                              Revoke
                            </button>
                          </>
                        )}
                        {key.status === 'revoked' && (
                          <button
                            onClick={() => updateKeyStatus(key.id, 'active')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                            title="Reactivate key"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => deleteKey(key.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          title="Delete key"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredKeys.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No keys found</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">All Users ({filteredUsers.length})</h3>
              <div className="space-y-3">
                {filteredUsers.map(user => {
                  const userKeysCount = allKeys.filter(k => k.user_id === user.id).length;
                  return (
                    <div
                      key={user.id}
                      className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{user.username || 'No username'}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-400">{userKeysCount}</div>
                          <div className="text-xs text-slate-400">License Keys</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No users found</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
