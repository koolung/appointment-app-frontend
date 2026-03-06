'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Employee {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      alert(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
            <p className="text-slate-600 mt-1">Manage your salon staff</p>
          </div>
          <Link
            href="/admin/employees/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Employee
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <p>No employees found</p>
              <Link href="/admin/employees/new" className="text-blue-600 hover:underline mt-2 inline-block">
                Create your first employee
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {employee.user.firstName} {employee.user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{employee.user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{employee.user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/admin/employees/${employee.id}`}
                        className="text-blue-600 hover:underline mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
