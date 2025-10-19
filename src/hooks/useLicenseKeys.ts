import { useState, useEffect } from 'react';
import { supabase, LicenseKey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useLicenseKeys() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchKeys = async () => {
    if (!user) {
      setKeys([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKeys(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  return { keys, loading, error, refetch: fetchKeys };
}