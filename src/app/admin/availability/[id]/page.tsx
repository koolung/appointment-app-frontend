'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const DAYS_OF_WEEK = [
  { id: -1, name: 'All Week' },
  { id: 0, name: 'Monday' },
  { id: 1, name: 'Tuesday' },
  { id: 2, name: 'Wednesday' },
  { id: 3, name: 'Thursday' },
  { id: 4, name: 'Friday' },
  { id: 5, name: 'Saturday' },
  { id: 6, name: 'Sunday' },
];

export default function AvailabilityEditorPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'exceptions'>('weekly');

  // Form states for weekly schedule
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);

  // Form states for exceptions
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionStartTime, setExceptionStartTime] = useState('09:00');
  const [exceptionEndTime, setExceptionEndTime] = useState('17:00');
  const [isFullDayOff, setIsFullDayOff] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await api.get(`/employees/${employeeId}`);
        setEmployee(empRes.data);

        const rulesRes = await api.get(`/availability/${employeeId}`);
        setRules(rulesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  const handleAddWeeklyRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const daysToAdd = selectedDay === -1 ? [0, 1, 2, 3, 4, 5, 6] : [selectedDay];
      let updatedRules = [...rules];
      const newRules: AvailabilityRule[] = [];

      for (const day of daysToAdd) {
        // Delete existing rule for this day if it exists
        const existingRule = rules.find(
          (r) => r.dayOfWeek === day && !r.isException
        );
        if (existingRule) {
          try {
            await api.delete(`/availability/${existingRule.id}`);
            updatedRules = updatedRules.filter((r) => r.id !== existingRule.id);
          } catch (deleteError) {
            console.error('Failed to delete existing rule:', deleteError);
          }
        }

        // Create new rule
        const response = await api.post('/availability', {
          employeeId,
          dayOfWeek: day,
          startTime,
          endTime,
          isException: false,
        });
        newRules.push(response.data);
      }

      setRules([...updatedRules, ...newRules]);
      alert(`Weekly schedule${daysToAdd.length > 1 ? 's' : ''} added successfully!`);
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedDay(0);
    } catch (error) {
      console.error('Failed to add rule:', error);
      alert('Failed to add weekly schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Parse date to get correct dayOfWeek without timezone issues
      const [year, month, day] = exceptionDate.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const response = await api.post('/availability', {
        employeeId,
        dayOfWeek: dateObj.getDay(),
        startTime: isFullDayOff ? '00:00' : exceptionStartTime,
        endTime: isFullDayOff ? '00:00' : exceptionEndTime,
        isException: true,
        exceptionDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString(),
      });

      setRules([...rules, response.data]);
      alert('Exception added successfully!');
      setExceptionDate('');
      setExceptionStartTime('09:00');
      setExceptionEndTime('17:00');
      setIsFullDayOff(true);
    } catch (error) {
      console.error('Failed to add exception:', error);
      alert('Failed to add exception');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this rule?')) return;

    try {
      await api.delete(`/availability/${ruleId}`);
      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const getWeeklyRules = () => {
    return rules.filter((r) => !r.isException).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  };

  const getExceptionRules = () => {
    return rules.filter((r) => r.isException);
  };

  const dayHasSchedule = (dayId: number) => {
    return getWeeklyRules().some((r) => r.dayOfWeek === dayId);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-slate-600">Loading employee data...</div>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-slate-600">Employee not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.user.firstName} {employee.user.lastName}
            </h1>
            <p className="text-slate-600 mt-1">Configure availability and work schedule</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'exceptions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Days Off & Exceptions
          </button>
        </div>

        {/* Weekly Schedule */}
        {activeTab === 'weekly' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add Weekly Schedule</h2>
              <form onSubmit={handleAddWeeklyRule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                  <strong>Tip:</strong> Use standard business hours format (e.g., 09:00 - 17:00).
                  This will repeat every week.
                </div>

                <button
                  type="submit"
                  disabled={submitting || dayHasSchedule(selectedDay)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    submitting || dayHasSchedule(selectedDay)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Adding...' : 'Add Schedule'}
                </button>

                {dayHasSchedule(selectedDay) && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    This day already has a schedule. Delete it first to add a new one.
                  </div>
                )}
              </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Current Schedule</h2>
              {getWeeklyRules().length === 0 ? (
                <div className="text-slate-600 text-center py-8">No schedule configured yet</div>
              ) : (
                <div className="space-y-2">
                  {getWeeklyRules().map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {DAYS_OF_WEEK.find((d) => d.id === rule.dayOfWeek)?.name}
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
          </div>
        )}

        {/* Exceptions */}
        {activeTab === 'exceptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add Exception</h2>
              <form onSubmit={handleAddException} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={isFullDayOff}
                      onChange={(e) => setIsFullDayOff(e.target.checked)}
                      className="w-4 h-4 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-900">Full Day Off</span>
                  </label>
                </div>

                {!isFullDayOff && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={exceptionStartTime}
                        onChange={(e) => setExceptionStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={exceptionEndTime}
                        onChange={(e) => setExceptionEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                  <strong>Exception Types:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Full day off: employee unavailable all day</li>
                    <li>• Partial: custom hours (e.g., afternoon off)</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !exceptionDate}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    submitting || !exceptionDate
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Adding...' : 'Add Exception'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Scheduled Exceptions</h2>
              {getExceptionRules().length === 0 ? (
                <div className="text-slate-600 text-center py-8">No exceptions scheduled</div>
              ) : (
                <div className="space-y-2">
                  {getExceptionRules().map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {new Date(rule.exceptionDate || '').toLocaleDateString()}
                        </div>
                        <div className="text-sm text-slate-600">
                          {rule.startTime === '00:00' && rule.endTime === '00:00'
                            ? '🗓️ Full day off'
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
    </AdminLayout>
  );
}
