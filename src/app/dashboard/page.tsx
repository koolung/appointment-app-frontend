'use client';

import { useState, useEffect } from 'react';
import { appointmentsAPI, api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [minCancellationHours, setMinCancellationHours] = useState(24);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSettings();
    loadAppointments();
  }, [user, router]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data?.minCancellationHours) {
        setMinCancellationHours(response.data.minCancellationHours);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default minimum cancellation hours if settings fetch fails
    }
  };

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await appointmentsAPI.getMyAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await appointmentsAPI.cancel(appointmentId);
      loadAppointments();
      alert('Appointment cancelled successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredAppointments = filterStatus
    ? appointments.filter((apt) => apt.status === filterStatus)
    : appointments;

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.startTime) > new Date()
  );
  const pastAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.startTime) <= new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
            <p className="text-purple-100">View and manage your salon appointments</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-purple-600 text-sm font-semibold">Total</p>
                <p className="text-2xl font-bold text-purple-900">{appointments.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-600 text-sm font-semibold">Confirmed</p>
                <p className="text-2xl font-bold text-green-900">
                  {appointments.filter((a) => a.status === 'CONFIRMED').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-yellow-600 text-sm font-semibold">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {appointments.filter((a) => a.status === 'PENDING').length}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-600 text-sm font-semibold">Upcoming</p>
                <p className="text-2xl font-bold text-blue-900">{upcomingAppointments.length}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilterStatus(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading your appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {filterStatus
                    ? `You don't have any ${filterStatus.toLowerCase()} appointments`
                    : "You don't have any appointments yet"}
                </p>
                <Link
                  href="/booking"
                  className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Book Your First Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h3>
                    <div className="space-y-3">
                      {upcomingAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          isExpanded={expandedId === apt.id}
                          onToggle={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                          onCancel={() => handleCancel(apt.id)}
                          minCancellationHours={minCancellationHours}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pastAppointments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-8">Past</h3>
                    <div className="space-y-3">
                      {pastAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          isExpanded={expandedId === apt.id}
                          onToggle={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                          onCancel={() => handleCancel(apt.id)}
                          minCancellationHours={minCancellationHours}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Book New Button */}
            {!isLoading && (
              <div className="mt-8 text-center">
                <Link
                  href="/booking"
                  className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-medium"
                >
                  Book New Appointment
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  minCancellationHours?: number;
}

function AppointmentCard({ appointment, isExpanded, onToggle, onCancel, minCancellationHours = 24 }: AppointmentCardProps) {
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const serviceName = appointment.services
    ?.map((s: any) => s.service?.name)
    .join(', ') || 'Unknown Service';
  const employeeName = appointment.employee
    ? `${appointment.employee.user?.firstName} ${appointment.employee.user?.lastName}`
    : 'Unknown Stylist';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 text-lg">{serviceName}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                appointment.status
              )}`}
            >
              {appointment.status}
            </span>
          </div>

          <p className="text-gray-600 text-sm mt-2">
            <span className="font-medium">💇 Stylist:</span> {employeeName}
          </p>

          <p className="text-gray-600 text-sm mt-1">
            <span className="font-medium">📅 Date:</span>{' '}
            {startDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <p className="text-gray-600 text-sm">
            <span className="font-medium">🕐 Time:</span> {startDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            - {endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>

          <p className="text-gray-600 text-sm">
            <span className="font-medium">⏱️ Duration:</span>{' '}
            {Math.round((endDate.getTime() - startDate.getTime()) / 60000)} minutes
          </p>

          {appointment.notes && (
            <p className="text-gray-600 text-sm mt-2">
              <span className="font-medium">📝 Notes:</span> {appointment.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2 ml-4 flex-col items-end">
          {['PENDING', 'CONFIRMED'].includes(appointment.status) && (() => {
            const now = new Date();
            const appointmentTime = new Date(appointment.startTime);
            const msUntilAppointment = appointmentTime.getTime() - now.getTime();
            const hoursUntilAppointment = msUntilAppointment / (1000 * 60 * 60);
            const canCancel = hoursUntilAppointment > minCancellationHours;

            return canCancel ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition"
              >
                Cancel
              </button>
            ) : (
              <span className="text-xs text-gray-500">Cannot cancel within {minCancellationHours} hours</span>
            );
          })()}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Total Price:</span>
              </p>
              <p className="text-lg font-bold text-purple-600">
                ${appointment.services?.reduce((sum: number, s: any) => sum + (s.price || 0), 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Timezone:</span>
              </p>
              <p className="text-sm">{appointment.clientTimezone || 'UTC'}</p>
            </div>
            {appointment.createdAt && (
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Booked:</span>
                </p>
                <p className="text-sm">
                  {new Date(appointment.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
