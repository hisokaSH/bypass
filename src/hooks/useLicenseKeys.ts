import { useState, useEffect } from 'react';
import { LicenseKey } from '../lib/supabase';
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
      console.log('🔑 Fetching keys for user ID:', user.id);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-keys`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch keys');
      }

      const data = await response.json();
      console.log('🔑 Query response:', data);
      console.log('🔑 Number of keys returned:', data.keys?.length);

      setKeys(data.keys || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching keys:', err);
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
