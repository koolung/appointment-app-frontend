'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const isActive = (href: string) => pathname === href;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <i className="fi fi-rr-chart-line-up"></i> },
    { href: '/admin/employees', label: 'Employees', icon: <i className="fi fi-rr-users-alt"></i> },
    { href: '/admin/clients', label: 'Clients', icon: <i className="fi fi-rr-user"></i> },
    { href: '/admin/services', label: 'Services', icon: <i className="fi fi-rr-boxes"></i> },
    { href: '/admin/categories', label: 'Categories', icon: <i className="fi fi-rr-folder"></i> },
    { href: '/admin/appointments', label: 'Appointments', icon: <i className="fi fi-rr-calendar-day"></i> },
    { href: '/admin/availability', label: 'Availability', icon: <i className="fi fi-rr-clock"></i> },
    { href: '/admin/reports', label: 'Reports', icon: <i className="fi fi-br-stats"></i> },
    { href: '/admin/settings', label: 'Settings', icon: <i className="fi fi-rr-settings"></i> },
  ];

  return (
    <nav className="w-64 bg-slate-800 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-1">Salon Management</p>
      </div>

      <ul className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-600 border-l-4 border-blue-400'
                  : 'hover:bg-slate-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <i className="fi fi-br-exit"></i>
          <span>Logout</span>
        </button>
      </div>

      <div className="px-4 py-3 border-t border-slate-700 text-sm text-slate-400">
        <p>© 2026 Salon Booking</p>
      </div>
    </nav>
  );
}
