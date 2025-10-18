import { useState } from 'react';
import { Shield, Check, X, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ActivationPage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [machineId, setMachineId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    expiresAt?: string;
    daysRemaining?: number;
  } | null>(null);

  const formatLicenseKey = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join('-').substring(0, 19);
  };

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey || licenseKey.length !== 19) {
      setResult({
        success: false,
        message: 'Please enter a valid license key (format: XXXX-XXXX-XXXX-XXXX)'
      });
      return;
    }

    if (!machineId.trim()) {
      setResult({
        success: false,
        message: 'Please enter your machine ID'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-key', {
        body: {
          key: licenseKey,
          machine_id: machineId.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (data.valid) {
        setResult({
          success: true,
          message: 'License activated successfully!',
          expiresAt: data.expires_at,
          daysRemaining: data.days_remaining
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'License validation failed'
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to validate license. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzk5MTkxOSIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="w-full max-w-md relative">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl mb-4 transform hover:scale-105 transition-transform">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Vulcan Bypass</h1>
          <p className="text-slate-400">License Activation</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleActivate} className="space-y-6">
              {/* License Key Input */}
              <div>
                <label htmlFor="licenseKey" className="block text-sm font-medium text-slate-300 mb-2">
                  License Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="licenseKey"
                    type="text"
                    value={licenseKey}
                    onChange={handleLicenseKeyChange}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="block w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono text-lg tracking-wider"
                    disabled={loading}
                    maxLength={19}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Format: XXXX-XXXX-XXXX-XXXX
                </p>
              </div>

              {/* Machine ID Input */}
              <div>
                <label htmlFor="machineId" className="block text-sm font-medium text-slate-300 mb-2">
                  Machine ID
                </label>
                <input
                  id="machineId"
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  placeholder="Your hardware identifier"
                  className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-slate-500">
                  This is automatically detected by the application
                </p>
              </div>

              {/* Activate Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Activate License
                  </>
                )}
              </button>
            </form>

            {/* Result Message */}
            {result && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${
                result.success
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      {result.message}
                    </p>
                    {result.success && result.daysRemaining !== undefined && (
                      <div className="mt-2 space-y-1 text-sm text-slate-300">
                        <p>Days remaining: <span className="font-semibold text-white">{result.daysRemaining}</span></p>
                        {result.expiresAt && (
                          <p>Expires: <span className="font-semibold text-white">{new Date(result.expiresAt).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-900/30 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              Need a license? Contact your administrator
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Powered by secure license validation
          </p>
        </div>
      </div>
    </div>
  );
}
