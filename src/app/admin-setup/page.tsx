'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handlePromoteAdmin() {
    if (!email) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to promote user');
        return;
      }

      setMessage(`✓ ${email} is now an admin!`);
      setTimeout(() => router.push('/admin'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-4 inline-block rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          Development Mode
        </div>
        <h1 className="mb-2 text-2xl font-bold">Admin Setup</h1>
        <p className="mb-6 text-sm text-gray-600">
          Promote your user to admin (development mode - no Supabase connection)
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              dir="ltr"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-500">Must match the email you signed up with</p>
          </div>

          <button
            onClick={handlePromoteAdmin}
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Promoting...' : 'Promote to Admin'}
          </button>

          {message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-sm mb-2">Setup Steps</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Sign up at <code className="bg-gray-100 px-1 rounded">/auth/signup</code></li>
            <li>2. You're automatically logged in</li>
            <li>3. Use this form to promote yourself to admin</li>
            <li>4. Access <code className="bg-gray-100 px-1 rounded">/admin</code> panel</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
