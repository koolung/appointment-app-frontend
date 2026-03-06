'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    salonName: 'My Salon',
    email: user?.email || '',
    phone: '(555) 123-4567',
    address: '123 Main St, City, State 12345',
    openingTime: '09:00',
    closingTime: '18:00',
    bookingNotifications: true,
    appointmentReminders: true,
    minCancellationHours: 24,
    bookingWarningMessage: 'Please note: Appointments cancelled less than 24 hours before the scheduled time may incur a cancellation fee.',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await api.put('/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Configure your salon preferences</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading settings...</p>
          </div>
        ) : (
          <>
            {/* Business Settings */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Salon Name
                  </label>
                  <input
                    type="text"
                    name="salonName"
                    value={settings.salonName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={settings.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={settings.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Business Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    name="openingTime"
                    value={settings.openingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    name="closingTime"
                    value={settings.closingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="bookingNotifications"
                    checked={settings.bookingNotifications}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-slate-900">Notify me of new bookings</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="appointmentReminders"
                    checked={settings.appointmentReminders}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-slate-900">Send appointment reminders</span>
                </label>
              </div>
            </div>

            {/* Online Booking Rules */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Online Booking Rules</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Minimum Cancellation Time (hours)
                  </label>
                  <p className="text-sm text-slate-600 mb-2">
                    Clients cannot cancel appointments within this time frame before the appointment
                  </p>
                  <input
                    type="number"
                    name="minCancellationHours"
                    value={settings.minCancellationHours}
                    onChange={handleChange}
                    min="0"
                    max="168"
                    className="w-full md:w-32 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Current setting: Clients can cancel up to {settings.minCancellationHours} hours before appointment
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Booking Warning Message
                  </label>
                  <p className="text-sm text-slate-600 mb-2">
                    This message will be displayed to clients when they book appointments
                  </p>
                  <textarea
                    name="bookingWarningMessage"
                    value={settings.bookingWarningMessage}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}