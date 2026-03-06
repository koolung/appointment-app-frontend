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
  };
}

interface AvailabilityRule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isException: boolean;
  exceptionDate?: string;
}

interface EmployeeAvailability {
  employee: Employee;
  rules: AvailabilityRule[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const [employees, setEmployees] = useState<EmployeeAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await api.get('/employees');
        const empData = empRes.data || [];

        // Fetch availability rules for each employee
        const employeeAvailability = await Promise.all(
          empData.map(async (emp: Employee) => {
            try {
              const rulesRes = await api.get(`/availability/${emp.id}`);
              return {
                employee: emp,
                rules: rulesRes.data || [],
              };
            } catch {
              return {
                employee: emp,
                rules: [],
              };
            }
          })
        );

        setEmployees(employeeAvailability);
      } catch (error) {
        console.error('Failed to fetch availability data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEmployeeAvailability = (employeeId: string) => {
    return employees.find((e) => e.employee.id === employeeId);
  };

  const getWeeklyRules = (employeeId: string) => {
    const emp = getEmployeeAvailability(employeeId);
    if (!emp) return [];
    return emp.rules.filter((r) => !r.isException).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  };

  const getExceptionRules = (employeeId: string) => {
    const emp = getEmployeeAvailability(employeeId);
    if (!emp) return [];
    return emp.rules.filter((r) => r.isException);
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this availability rule?')) return;

    try {
      await api.delete(`/availability/${ruleId}`);
      // Refresh data
      const updated = employees.map((e) => ({
        ...e,
        rules: e.rules.filter((r) => r.id !== ruleId),
      }));
      setEmployees(updated);
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Availability Management</h1>
            <p className="text-slate-600 mt-1">Configure work hours, breaks, and days off</p>
          </div>
          {selectedEmployee && (
            <button
              onClick={() => setSelectedEmployee(null)}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading availability data...</div>
        ) : !selectedEmployee ? (
          // Employee Selection
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const weeklyRules = emp.rules.filter((r) => !r.isException);
              const exceptionRules = emp.rules.filter((r) => r.isException);

              return (
                <div
                  key={emp.employee.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedEmployee(emp.employee.id)}
                >
                  <h3 className="font-bold text-slate-900 mb-2">
                    {emp.employee.user.firstName} {emp.employee.user.lastName}
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>
                      <strong>{weeklyRules.length}</strong> weekly schedules
                    </div>
                    <div>
                      <strong>{exceptionRules.length}</strong> exceptions
                    </div>
                  </div>
                  <Link
                    href={`/admin/availability/${emp.employee.id}`}
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Configure
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          // Employee Details
          <div className="space-y-6">
            {getEmployeeAvailability(selectedEmployee) && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  {getEmployeeAvailability(selectedEmployee)?.employee.user.firstName}{' '}
                  {getEmployeeAvailability(selectedEmployee)?.employee.user.lastName} - Schedule
                </h2>

                {/* Weekly Schedule */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Weekly Schedule</h3>
                    <Link
                      href={`/admin/availability/${selectedEmployee}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit Schedule
                    </Link>
                  </div>

                  {getWeeklyRules(selectedEmployee).length === 0 ? (
                    <div className="text-slate-600 text-sm">No weekly schedule configured</div>
                  ) : (
                    <div className="space-y-2">
                      {getWeeklyRules(selectedEmployee).map((rule) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {DAYS_OF_WEEK[rule.dayOfWeek]}
                            </div>
                            <div className="text-sm text-slate-600">
                              {rule.startTime} - {rule.endTime}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exceptions */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Days Off & Exceptions</h3>
                    <Link
                      href={`/admin/availability/${selectedEmployee}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add Exception
                    </Link>
                  </div>

                  {getExceptionRules(selectedEmployee).length === 0 ? (
                    <div className="text-slate-600 text-sm">No exceptions scheduled</div>
                  ) : (
                    <div className="space-y-2">
                      {getExceptionRules(selectedEmployee).map((rule) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {new Date(rule.exceptionDate || '').toLocaleDateString()}
                            </div>
                            <div className="text-sm text-slate-600">
                              {rule.startTime === '00:00' && rule.endTime === '00:00'
                                ? 'Day Off'
                                : `${rule.startTime} - ${rule.endTime}`}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
