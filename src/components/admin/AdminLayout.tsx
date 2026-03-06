'use client';

import AdminNavigation from './AdminNavigation';
import { useAuth } from '@/store/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isInitialized, initializeAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initialize auth from localStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Check auth status after initialization
    if (isInitialized) {
      if (!token) {
        router.push('/login');
        return;
      }

      if (user?.role !== 'ADMIN') {
        console.log('User role:', user?.role, 'Is not admin');
        router.push('/dashboard');
        return;
      }

      setIsChecking(false);
    }
  }, [isInitialized, token, user, router]);

  // Show loading while checking auth
  if (isChecking || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="text-slate-600 mb-2">Loading...</div>
          <p className="text-sm text-slate-500">Verifying admin access</p>
        </div>
      </div>
    );
  }

  // If we get here, auth is verified
  return (
    <div className="flex h-screen bg-slate-50">
      <AdminNavigation />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
