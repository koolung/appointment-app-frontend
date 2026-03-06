'use client';

import { useAuth } from '@/store/auth';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { user, token, isInitialized, initializeAuth } = useAuth();
  const [storageData, setStorageData] = useState<any>(null);

  useEffect(() => {
    initializeAuth();
    
    // Check localStorage directly
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      setStorageData({
        token: token ? `${token.substring(0, 20)}...` : 'No token',
        user: user ? JSON.parse(user) : 'No user',
      });
    }
  }, [initializeAuth]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug: Auth State</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">Zustand Store State</h2>
          <pre className="bg-slate-50 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(
              {
                user,
                token: token ? `${token.substring(0, 20)}...` : null,
                isInitialized,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">localStorage</h2>
          <pre className="bg-slate-50 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(storageData, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">User Details</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Role:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{user.role}</span></p>
            </div>
          ) : (
            <p className="text-slate-600">No user logged in</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">Admin Access</h2>
          {user?.role === 'ADMIN' ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded text-green-800">
              ✓ You are an ADMIN - you should be able to access /admin
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-4 rounded text-red-800">
              ✗ You are NOT an ADMIN (role: {user?.role || 'not set'})
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-bold text-lg mb-2">How to fix</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
            <li>Log in with your admin account</li>
            <li>Check this page to verify the role is set to "ADMIN"</li>
            <li>If the role is wrong, the user needs to be created with ADMIN role in the database</li>
            <li>You can use the /auth/admin/create endpoint to create an admin user</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
