'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navigation() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Don't show navigation on auth pages or admin dashboard
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/admin')) {
    return null;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/booking', label: 'Book Appointment', icon: '📅' },
    { href: '/dashboard', label: 'My Appointments', icon: '📋' },
  ];

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold">
              ✨ Salon
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-purple-800 text-white'
                    : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm">
                <p className="text-purple-100">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <details className="dropdown">
              <summary className="btn btn-ghost text-white">
                ☰
              </summary>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-purple-700 rounded-box w-52">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
}
