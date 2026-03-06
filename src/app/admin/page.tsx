'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import QuickActions from '@/components/admin/QuickActions';
import api from '@/lib/api';

interface DashboardStats {
  appointmentsToday: number;
  appointmentsThisMonth: number;
  totalEmployees: number;
  totalServices: number;
  revenue: number;
  revenueThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    appointmentsThisMonth: 0,
    totalEmployees: 0,
    totalServices: 0,
    revenue: 0,
    revenueThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch employees
        const employeesRes = await api.get('/employees');
        const employees = employeesRes.data || [];

        // Fetch services
        const servicesRes = await api.get('/services');
        const services = servicesRes.data || [];

        // Fetch revenue report
        const revenueRes = await api.get('/reports/revenue', {
          params: {
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            endDate: new Date(),
          },
        });

        setStats({
          appointmentsToday: 8, // Placeholder
          appointmentsThisMonth: 42, // Placeholder
          totalEmployees: employees.length,
          totalServices: services.length,
          revenue: 15240, // Placeholder
          revenueThisMonth: 12500, // Placeholder
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your salon's performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon="📅"
            label="Appointments Today"
            value={stats.appointmentsToday}
            trend={{ direction: 'up', percentage: 12 }}
            color="blue"
          />
          <StatCard
            icon="👥"
            label="Total Employees"
            value={stats.totalEmployees}
            color="green"
          />
          <StatCard
            icon="✨"
            label="Total Services"
            value={stats.totalServices}
            color="purple"
          />
          <StatCard
            icon="💰"
            label="Revenue This Month"
            value={`$${stats.revenueThisMonth.toLocaleString()}`}
            trend={{ direction: 'up', percentage: 8 }}
            color="green"
          />
          <StatCard
            icon="📊"
            label="Total Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            color="orange"
          />
          <StatCard
            icon="📈"
            label="Month Appointments"
            value={stats.appointmentsThisMonth}
            trend={{ direction: 'up', percentage: 15 }}
            color="blue"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">New appointment booked</p>
                <p className="text-sm text-slate-600">Sarah Johnson booked with Mary</p>
              </div>
              <span className="text-sm text-slate-500">10 min ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">Payment received</p>
                <p className="text-sm text-slate-600">$85.00 from online booking</p>
              </div>
              <span className="text-sm text-slate-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900">Service completed</p>
                <p className="text-sm text-slate-600">Hair cut and styling</p>
              </div>
              <span className="text-sm text-slate-500">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
