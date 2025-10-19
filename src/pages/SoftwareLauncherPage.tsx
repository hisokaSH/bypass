import { useState, useEffect } from 'react';
import { Shield, Check, X, Loader2, KeyRound, User, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LauncherState = 'auth' | 'claiming' | 'validating' | 'success' | 'error';

export default function SoftwareLauncherPage() {
  const [state, setState] = useState<LauncherState>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [machineId, setMachineId] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [availableKeys, setAvailableKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hwid = params.get('hwid');
    if (hwid) {
      setMachineId(hwid);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.rpc('register_user', {
          p_username: username,
          p_password: password,
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        setUserId(data.user_id);
      } else {
        const { data, error } = await supabase.rpc('authenticate_user', {
          p_username: username,
          p_password: password,
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        setUserId(data.user_id);
      }

      await fetchUserKeys();
      setState('claiming');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserKeys = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-keys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ username }),
        }
      );

      const data = await response.json();

      if (data.keys && data.keys.length > 0) {
        setAvailableKeys(data.keys);
      } else {
        setError('No license keys found for your account. Please contact support.');
      }
    } catch (err: any) {
      setError('Failed to fetch your license keys');
    }
  };

  const handleClaimAndValidate = async () => {
    if (!selectedKey) {
      setError('Please select a license key');
      return;
    }

    if (!machineId.trim()) {
      setError('Machine ID is required');
      return;
    }

    setLoading(true);
    setError('');
    setState('validating');

    try {
      const claimResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            key: selectedKey,
            machine_id: machineId.trim(),
            username: username,
          }),
        }
      );

      const claimData = await claimResponse.json();

      if (!claimData.success) {
        throw new Error(claimData.error || 'Failed to claim license key');
      }

      const validateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            key: selectedKey,
            machine_id: machineId.trim(),
          }),
        }
      );

      const validateData = await validateResponse.json();

      if (validateData.valid) {
        setSuccessMessage(`License activated! ${validateData.days_remaining} days remaining`);
        setState('success');

        if (window.opener) {
          window.opener.postMessage({
            type: 'LICENSE_VALIDATED',
            key: selectedKey,
            valid: true,
            expires_at: validateData.expires_at,
            days_remaining: validateData.days_remaining
          }, '*');
        }

        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        throw new Error(validateData.error || 'License validation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate license');
      setState('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzk5MTkxOSIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Vulcan Bypass</h1>
          <p className="text-slate-400">Software Activation</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {state === 'auth' && (
            <div className="p-8">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    authMode === 'login'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="inline h-4 w-4 mr-2" />
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    authMode === 'signup'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="inline h-4 w-4 mr-2" />
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {authMode === 'login' ? 'Login' : 'Sign Up'}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {state === 'claiming' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-4">Select Your License Key</h2>

              <div className="space-y-4 mb-6">
                {availableKeys.map((key) => (
                  <div
                    key={key.key}
                    onClick={() => setSelectedKey(key.key)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedKey === key.key
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-white font-semibold">{key.key}</p>
                        <p className="text-sm text-slate-400 mt-1">{key.product_name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Expires: {new Date(key.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedKey === key.key && (
                        <Check className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Machine ID
                </label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  placeholder="Auto-detected from your PC"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleClaimAndValidate}
                disabled={loading || !selectedKey}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Activate License
                  </>
                )}
              </button>
            </div>
          )}

          {state === 'validating' && (
            <div className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-white font-semibold">Validating your license...</p>
              <p className="text-slate-400 text-sm mt-2">Please wait</p>
            </div>
          )}

          {state === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-green-400 mb-4">{successMessage}</p>
              <p className="text-slate-400 text-sm">Software will launch automatically...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Activation Failed</h2>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => setState('claiming')}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
