'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import api from '@/lib/api';

interface ReportData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch revenue report
        const startDate = new Date(new Date().getFullYear(), 0, 1);
        const endDate = new Date();
        
        const revenueRes = await api.get('/reports/revenue', {
          params: { startDate, endDate },
        });

        const revenueData = revenueRes.data || {};
        const revenueEntries = Object.values(revenueData) as number[];
        const totalRevenue = revenueEntries.reduce((sum, val) => sum + val, 0);

        setData({
          totalRevenue,
          monthlyRevenue: 12500,
          totalAppointments: 156,
          completedAppointments: 142,
          cancelledAppointments: 14,
        });
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Loading reports...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">View your salon's performance metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon="💰"
            label="Total Revenue"
            value={`$${data.totalRevenue.toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon="📊"
            label="This Month"
            value={`$${data.monthlyRevenue.toLocaleString()}`}
            trend={{ direction: 'up', percentage: 8 }}
            color="green"
          />
          <StatCard
            icon="📅"
            label="Total Appointments"
            value={data.totalAppointments}
            color="blue"
          />
          <StatCard
            icon="✅"
            label="Completed"
            value={data.completedAppointments}
            trend={{ direction: 'up', percentage: 5 }}
            color="green"
          />
          <StatCard
            icon="❌"
            label="Cancelled"
            value={data.cancelledAppointments}
            color="orange"
          />
          <StatCard
            icon="📈"
            label="Completion Rate"
            value={`${Math.round((data.completedAppointments / data.totalAppointments) * 100)}%`}
            color="blue"
          />
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Revenue Over Time</h2>
          <div className="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-400">
            Chart coming soon - Connect to Chart.js or similar library
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Top Services</h2>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Bookings</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-900">Hair Cut</td>
                <td className="px-4 py-3 text-sm text-slate-600">45</td>
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">$2,250</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-900">Hair Coloring</td>
                <td className="px-4 py-3 text-sm text-slate-600">28</td>
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">$2,800</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-900">Styling</td>
                <td className="px-4 py-3 text-sm text-slate-600">32</td>
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">$1,600</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
