'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  baseDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  category?: {
    name: string;
  };
}

interface Employee {
  id: string;
  isActive: boolean;
  user?: {
    firstName: string;
    lastName: string;
  };
  employeeServices?: Array<{
    service?: {
      id: string;
      name: string;
    };
  }>;
}

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface InteractiveCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Helper function to parse date strings as local dates instead of UTC
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function InteractiveCalendar({ selectedDate, onDateChange }: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);

    return testDate < today || testDate > sixtyDaysFromNow;
  };

  const formatDateString = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(clickedDate)) {
      const dateString = formatDateString(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate());
      onDateChange(dateString);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
          title="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-center font-bold text-gray-900 flex-1">{monthName}</h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
          title="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const disabled = isDateDisabled(cellDate);
          const isSelected = selectedDate && 
            parseLocalDate(selectedDate).toDateString() === cellDate.toDateString();
          const isToday = cellDate.toDateString() === today.toDateString();

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              className={`
                aspect-square flex items-center justify-center rounded-lg font-medium text-sm
                transition-all duration-200
                ${disabled
                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#35514e] text-white font-bold shadow-md'
                  : isToday
                  ? 'bg-[#e0d7f3] text-[#4b2995] border-2 border-[#4b2995]'
                  : 'text-gray-700 bg-white hover:bg-[#f3e8ff] border border-gray-200'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GuestBookingPage() {
  const router = useRouter();

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [employeeAvailabilityCount, setEmployeeAvailabilityCount] = useState<Record<string, number>>({});
  const [bookingWarningMessage, setBookingWarningMessage] = useState('');

  // Selection states
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Guest contact details
  const [guestFullName, setGuestFullName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [contactDetailsError, setContactDetailsError] = useState('');

  // UI states
  const [isCategoryNavOpen, setIsCategoryNavOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);
  const [isServicesReminderExpanded, setIsServicesReminderExpanded] = useState(false);
  const [isSummaryDetailExpanded, setIsSummaryDetailExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Account creation states
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [nextAvailableSlot, setNextAvailableSlot] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  // Step state (0 = services, 1 = employee/date/time, 2 = contact details, 3 = review, 4 = success)
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);

    loadSettings();
    loadServices();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (services.length > 0 && !selectedCategory) {
      const categories = getServiceCategories();
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [services, selectedCategory]);

  useEffect(() => {
    if (step === 1 && !selectedDate) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setSelectedDate(dateString);
    }
  }, [step, selectedDate]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data?.bookingWarningMessage) {
        setBookingWarningMessage(response.data.bookingWarningMessage);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.filter((s: Service) => s));
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees?isActive=true');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || selectedServices.length === 0) {
      console.log('Skipping loadAvailableSlots - selectedDate:', selectedDate, 'selectedServices:', selectedServices.length);
      return;
    }

    setIsLoading(true);
    try {
      const duration = getSelectedServicesDetails().reduce((total, s) => total + s.baseDuration, 0);
      console.log('Loading slots for:', { selectedDate, duration, selectedEmployee: selectedEmployee || 'any', userTimezone });
      
      // If no employee selected (No Preference), merge slots from all employees
      if (selectedEmployee === null) {
        const allSlots: any[] = [];
        const slotSet = new Set<string>(); // To track unique times

        // Fetch slots for all employees
        for (const emp of employees) {
          try {
            const response = await api.get(`/availability/slots/${emp.id}`, {
              params: {
                date: selectedDate,
                duration: duration,
                timezone: userTimezone,
              },
            });
            
            const empSlots = response.data || [];
            // Add unique slots (by start time)
            empSlots.forEach((slot: any) => {
              if (!slotSet.has(slot.start)) {
                slotSet.add(slot.start);
                allSlots.push(slot);
              }
            });
          } catch (err) {
            // Skip employee if their slots fail to load
            console.warn(`Failed to load slots for employee ${emp.id}:`, err);
          }
        }

        // Sort slots by start time
        allSlots.sort((a: any, b: any) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        // Filter out past slots and mark next available
        const now = new Date();
        const futureSlots = allSlots.filter((slot: any) => new Date(slot.start) > now);
        
        futureSlots.forEach((slot: any, idx: number) => {
          if (idx === 0) {
            slot.isNextAvailable = true;
          } else {
            delete slot.isNextAvailable;
          }
        });

        setAvailableSlots(futureSlots);
        const nextSlot = futureSlots.find((slot: any) => slot.isNextAvailable);
        setNextAvailableSlot(nextSlot?.start || null);
      } else {
        // Original logic for specific employee selection
        const response = await api.get(`/availability/slots/${selectedEmployee}`, {
          params: {
            date: selectedDate,
            duration: duration,
            timezone: userTimezone,
          },
        });
        let slots = response.data || [];
        
        // Filter out past slots
        const now = new Date();
        slots = slots.filter((slot: any) => new Date(slot.start) > now);
        
        setAvailableSlots(slots);
        
        // Find next available slot
        const nextSlot = slots.find((slot: any) => slot.isNextAvailable);
        setNextAvailableSlot(nextSlot?.start || null);
      }
    } catch (error: any) {
      console.error('Failed to load available slots:', error.response?.data || error.message);
      setAvailableSlots([]);
      setNextAvailableSlot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmployeeAvailability = async () => {
    if (!selectedDate) return;

    try {
      const counts: Record<string, number> = {};
      for (const emp of employees.filter(e => e.isActive !== false)) {
        const response = await api.get(`/availability/slots/${emp.id}`, {
          params: {
            date: selectedDate,
            duration: getTotalDuration(),
          },
        });
        counts[emp.id] = response.data?.length || 0;
      }
      setEmployeeAvailabilityCount(counts);
    } catch (error) {
      console.error('Failed to check employee availability:', error);
    }
  };

  useEffect(() => {
    if (step === 1 && selectedDate && selectedServices.length > 0) {
      loadAvailableSlots();
      checkEmployeeAvailability();
    }
  }, [step, selectedDate, selectedEmployee, selectedServices]);

  const getSelectedServicesDetails = () => {
    return services.filter((s) => selectedServices.includes(s.id));
  };

  const getTotalDuration = () => {
    return getSelectedServicesDetails().reduce((total, s) => total + s.baseDuration, 0);
  };

  const getTotalPrice = () => {
    return getSelectedServicesDetails().reduce((total, s) => total + s.price, 0);
  };

  const getServiceCategories = () => {
    const categories = [...new Set(services.map(s => s.category?.name).filter(Boolean))];
    return categories.sort() as string[];
  };

  const getServicesByCategory = (category: string | null) => {
    if (!category) return [];
    return services.filter(s => s.category?.name === category);
  };

  const getEmployeeSpecialties = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.employeeServices?.map((es) => es.service) || [];
  };

  const canEmployeeProvidServices = (employeeId: string) => {
    if (selectedServices.length === 0) return true;
    const specialties = getEmployeeSpecialties(employeeId);
    return selectedServices.every((serviceId) =>
      specialties.some((s) => s?.id === serviceId)
    );
  };

  const handleContinueFromServices = () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }
    setStep(1);
  };

  const handleContinueFromDateTime = () => {
    if (!selectedTime) {
      alert('Please select a time');
      return;
    }
    setStep(2);
  };

  const handleContinueFromContact = () => {
    setContactDetailsError('');

    const nameParts = guestFullName.trim().split(' ');
    if (!guestFullName.trim()) {
      setContactDetailsError('Full name is required');
      return;
    }
    if (!guestEmail.trim()) {
      setContactDetailsError('Email is required');
      return;
    }
    if (!guestEmail.includes('@')) {
      setContactDetailsError('Please enter a valid email');
      return;
    }
    if (!guestPhone.trim()) {
      setContactDetailsError('Phone number is required');
      return;
    }

    setStep(3);
  };

  const handleBooking = async () => {
    const dateObj = parseLocalDate(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes, 0);
    const now = new Date();
    if (startTime <= now) {
      alert('You cannot book appointments in the past. Please select a future date and time.');
      setSelectedTime('');
      return;
    }

    setIsBooking(true);
    try {
      const endTime = new Date(startTime.getTime() + getTotalDuration() * 60000);
      const nameParts = guestFullName.trim().split(' ');

      const response = await api.post('/appointments', {
        clientId: 'temp-guest-booking',
        employeeId: selectedEmployee,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        serviceIds: selectedServices,
        bookingSource: 'WEB_GUEST',
        clientTimezone: userTimezone,
        clientFirstName: nameParts[0],
        clientLastName: nameParts.slice(1).join(' ') || 'Guest',
        clientEmail: guestEmail,
        clientPhone: guestPhone,
      });

      setStep(4);
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCreateAccount = async () => {
    setAccountError('');

    if (!accountPassword) {
      setAccountError('Password is required');
      return;
    }
    if (accountPassword.length < 8) {
      setAccountError('Password must be at least 8 characters');
      return;
    }
    if (accountPassword !== accountConfirmPassword) {
      setAccountError('Passwords do not match');
      return;
    }

    setIsCreatingAccount(true);
    try {
      await api.post('/auth/guest-activate', {
        email: guestEmail,
        password: accountPassword,
      });
      setAccountCreated(true);
      setShowCreateAccount(false);
    } catch (error: any) {
      setAccountError(error.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-white text-gray-900 p-8 border-t-xl">
            <h1 className="text-4xl font-bold mb-2">Guest Booking</h1>
            <p className="text-gray-600">Guest Booking - No Account Required</p>
          </div>

          {/* Booking Warning Message */}
          {bookingWarningMessage && (
            <div className="bg-gray-50 border-l-4 border-[#35514e] mx-8 md:mt-6">
              {/* Mobile: collapsible */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-[#35514e] text-sm">Cancellation Policy</span>
                  <svg
                    className={`w-4 h-4 text-[#35514e] transition-transform duration-300 ${isPolicyExpanded ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPolicyExpanded ? 'max-h-40' : 'max-h-0'}`}>
                  <p className="px-4 pb-4 text-sm text-[#35514e]">{bookingWarningMessage}</p>
                </div>
              </div>
              {/* Desktop: always visible */}
              <div className="hidden md:block p-4">
                <p className="font-semibold text-[#35514e]">{bookingWarningMessage}</p>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-center">
              {['Services', 'Date & Time', 'Contact', 'Review', 'Success'].map((label, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step >= idx
                        ? 'bg-[#35514e] text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > idx ? 'bg-[#35514e]' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Step 0: Service Selection */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Select Services</h2>
                  <p className="text-gray-600 mb-6">Choose the services and scroll down</p>
                </div>

                {/* Service Categories Sidebar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Categories */}
                  <div className="md:col-span-1">
                    <div className="sticky top-4 grid grid-cols-3 md:grid-cols-1 gap-1.5 md:gap-2">
                      {getServiceCategories().map((category: string) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-2.5 py-2 md:px-4 md:py-3 rounded-lg transition-colors font-medium text-xs md:text-sm ${
                            selectedCategory === category
                              ? 'bg-[#35514e] text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="md:col-span-3">
                    <div className="grid grid-cols-1 gap-3">
                      {getServicesByCategory(selectedCategory).map((service) => (
                        <div
                          key={service.id}
                          onClick={() => {
                            setSelectedServices((prev) =>
                              prev.includes(service.id)
                                ? prev.filter((id) => id !== service.id)
                                : [...prev, service.id]
                            );
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedServices.includes(service.id)
                              ? 'border-[#35514e] bg-[#e0f2f1]'
                              : 'border-gray-200 hover:border-[#35514e]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2 px-2 py-1 border-2 border-[#e5e7eb] rounded-2xl inline-flex items-center gap-1">
                                <i className="fi fi-rr-clock"></i> {service.baseDuration} minutes
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-[#35514e]">${service.price.toFixed(2)}</p>
                              {selectedServices.includes(service.id) && (
                                <p className="text-[#35514e] text-lg">✓</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary and Continue Button - Sticky Bottom Bar */}
                {selectedServices.length > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
                    <div className="max-w-4xl mx-auto">
                      {/* Collapsible service list */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isSummaryExpanded ? 'max-h-60' : 'max-h-0'
                        }`}
                      >
                        <div className="px-4 pt-3 pb-1 space-y-1.5 max-h-52 overflow-y-auto">
                          {getSelectedServicesDetails().map((service) => (
                            <div key={service.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{service.name} ({service.baseDuration} min)</span>
                              <span className="font-semibold text-gray-900">${service.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                              className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : 'rotate-0'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} • {getTotalDuration()} min • ${getTotalPrice().toFixed(2)}
                            </button>
                            <p className="text-xs text-gray-500 truncate ml-5.5">
                              {getSelectedServicesDetails().map(s => s.name).join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={handleContinueFromServices}
                            className="shrink-0 px-6 py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Floating Category Nav Panel */}
                <div className="md:hidden">
                  {/* Backdrop */}
                  {isCategoryNavOpen && (
                    <div
                      className="fixed inset-0 bg-black/20 z-40"
                      onClick={() => setIsCategoryNavOpen(false)}
                    />
                  )}

                  <div
                    className={`fixed top-1/2 -translate-y-1/2 right-0 z-50 transition-transform duration-300 ease-in-out ${
                      isCategoryNavOpen ? 'translate-x-0' : 'translate-x-[calc(100%-28px)]'
                    }`}
                  >
                    <div className="flex items-stretch">
                      {/* Tab handle */}
                      <button
                        onClick={() => setIsCategoryNavOpen(!isCategoryNavOpen)}
                        className="w-7 bg-[#35514e] text-white flex items-center justify-center shadow-lg shrink-0 py-3"
                      >
                        <span className="text-[14px] uppercase font-medium tracking-wide" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                          Categories
                        </span>
                      </button>

                      {/* Panel content */}
                      <div className="bg-white border border-r-0 border-gray-200 rounded-l-lg shadow-xl p-3 w-48">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categories</p>
                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                          {getServiceCategories().map((category: string) => (
                            <button
                              key={category}
                              onClick={() => {
                                setSelectedCategory(category);
                                setIsCategoryNavOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-xs font-medium ${
                                selectedCategory === category
                                  ? 'bg-[#35514e] text-white'
                                  : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                              }`}
                            >
                              {category}
                              <span className="ml-1 opacity-70">
                                ({getServicesByCategory(category).length})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Date & Time Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Choose Date & Time</h2>
                  <p className="text-gray-600 mb-6">Select your preferred stylist, date, and time</p>
                </div>

                {/* Selected Services Reminder */}
                <div className="bg-gray-50 border-l-4 border-[#35514e]">
                  {/* Mobile: collapsible */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setIsServicesReminderExpanded(!isServicesReminderExpanded)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-semibold text-[#35514e] text-sm">
                        Services Selected ({selectedServices.length}) • ${getTotalPrice().toFixed(2)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-[#35514e] transition-transform duration-300 ${isServicesReminderExpanded ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isServicesReminderExpanded ? 'max-h-60' : 'max-h-0'}`}>
                      <div className="px-4 pb-4 space-y-1">
                        {getSelectedServicesDetails().map((service) => (
                          <p key={service.id} className="text-sm text-[#35514e]">
                            • {service.name} ({service.baseDuration} mins) - ${service.price.toFixed(2)}
                          </p>
                        ))}
                        <p className="text-sm font-semibold text-[#35514e] mt-2">
                          Total: {getTotalDuration()} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: always visible */}
                  <div className="hidden md:block p-4">
                    <p className="font-semibold text-[#35514e] mb-2">Services Selected:</p>
                    <div className="space-y-1">
                      {getSelectedServicesDetails().map((service) => (
                        <p key={service.id} className="text-sm text-[#35514e]">
                          • {service.name} ({service.baseDuration} mins) - ${service.price.toFixed(2)}
                        </p>
                      ))}
                    </div>
                    <p className="font-semibold text-[#35514e] mt-2">
                      Total: {getTotalDuration()} minutes
                    </p>
                  </div>
                </div>

                {/* Employee Selection */}
                <div>
                  <label className="block text-gray-900 font-bold mb-3">Select Stylist</label>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className={`w-full p-2.5 md:p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedEmployee === null
                          ? 'border-[#35514e] bg-transparent'
                          : 'border-gray-200 hover:border-[#35514e]'
                      }`}
                    >
                      <p className="font-bold text-xs md:text-base text-gray-900">No Preference</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">Any available stylist</p>
                    </button>

                    <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
                      {employees.filter(emp => emp.isActive !== false).map((emp) => {
                        const canProvide = canEmployeeProvidServices(emp.id);
                        const availCount = employeeAvailabilityCount[emp.id] || 0;

                        return (
                          <div
                            key={emp.id}
                            onClick={() => canProvide && setSelectedEmployee(emp.id)}
                            className={`p-2 md:p-4 rounded-lg border-2 transition-all ${
                              !canProvide
                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                : selectedEmployee === emp.id
                                ? 'border-[#35514e] bg-transparent cursor-pointer'
                                : 'border-gray-200 hover:border-[#35514e] cursor-pointer'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start mb-1 md:mb-2">
                              <div>
                                <p className={`font-bold text-xs md:text-base ${!canProvide ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {emp.user?.firstName} {emp.user?.lastName}
                                </p>
                              </div>
                              {selectedDate && (
                                <div className={`text-[10px] md:text-xs font-semibold px-1.5 py-0.5 md:px-2 md:py-1 rounded mt-1 md:mt-0 ${
                                  availCount > 0
                                    ? 'bg-gray-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {availCount} slots
                                </div>
                              )}
                            </div>

                            {selectedServices.length > 0 && !canProvide && (
                              <p className="text-[10px] md:text-xs text-gray-600 font-semibold mb-1 md:mb-2">
                                ⚠️ N/A
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Date and Time Selection - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-gray-900 font-bold mb-3">Select Date</label>
                    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                      <InteractiveCalendar 
                        selectedDate={selectedDate}
                        onDateChange={(date) => {
                          setSelectedDate(date);
                          setSelectedTime('');
                          setNextAvailableSlot(null);
                        }}
                      />
                    </div>

                    {selectedDate && (
                      <div className="flex gap-3 items-center mb-3">
                        <div className="text-sm text-gray-700 font-medium">
                          Selected: {parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-lg font-medium">
                          {selectedEmployee === null
                            ? `${availableSlots.length} slots`
                            : `${employeeAvailabilityCount[selectedEmployee] ?? 0} slots`
                          }
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">Select a date at least 1 day in advance. <br></br>You can book up to 60 days ahead.</p>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-gray-900 font-bold">Select Time</label>
                        {nextAvailableSlot && (
                          <span className="text-xs bg-gray-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                            Next available: {new Date(nextAvailableSlot).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        )}
                      </div>

                      {isLoading ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-2">Loading available times...</p>
                          <div className="flex justify-center gap-1">
                            <div className="w-2 h-2 bg-[#35514e] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#35514e] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-[#35514e] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div>
                          <div className="text-xs text-gray-600 mb-4">
                            {parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })} • 15-minute slots • {userTimezone} timezone
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map((slot: any, idx: number) => {
                              const timeStr = new Date(slot.start).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              });
                              const isSelected = selectedTime === timeStr;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTime(timeStr)}
                                  className={`p-2 rounded-lg font-medium text-sm transition-all border ${
                                    isSelected
                                      ? 'border-purple-600 bg-[#35514e] text-white shadow-lg'
                                      : 'border-gray-300 bg-white hover:border-purple-500 text-gray-900'
                                  }`}
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-700 font-semibold">❌ No available times for this date</p>
                          <p className="text-red-600 text-sm mt-1">
                            Total duration required: {getTotalDuration()} minutes
                          </p>
                          <p className="text-red-600 text-sm">Try selecting a different date or employee.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleContinueFromDateTime}
                  disabled={!selectedTime}
                  className="w-full py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Contact Details
                </button>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Your Contact Details</h2>
                  <p className="text-gray-600 mb-6">We'll send your confirmation to this email</p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 border-l-4 border-[#35514e]">
                  {/* Mobile: collapsible */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setIsSummaryDetailExpanded(!isSummaryDetailExpanded)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-semibold text-[#35514e] text-sm">Appointment Summary</span>
                      <svg
                        className={`w-4 h-4 text-[#35514e] transition-transform duration-300 ${isSummaryDetailExpanded ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSummaryDetailExpanded ? 'max-h-60' : 'max-h-0'}`}>
                      <div className="px-4 pb-4 space-y-1 text-sm text-[#35514e]">
                        <p> {parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}</p>
                        <p> {selectedTime}</p>
                        <p> <i className="fi fi-rs-user"></i>{selectedEmployee === null ? 'Any Available Stylist' : 
                          employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                          employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                        <p><i className="fi fi-rr-clock"></i> {getTotalDuration()} minutes | ${getTotalPrice().toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: always visible */}
                  <div className="hidden md:block p-4">
                    <p className="font-semibold text-[#35514e] mb-3">Appointment Summary:</p>
                    <div className="space-y-1 text-sm text-[#35514e]">
                      <p> {parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                      <p> {selectedTime}</p>
                      <p> <i className="fi fi-rs-user"></i>{selectedEmployee === null ? 'Any Available Stylist' : 
                        employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                        employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                      <p><i className="fi fi-rr-clock"></i> {getTotalDuration()} minutes | ${getTotalPrice().toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                {contactDetailsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {contactDetailsError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guestFullName}
                      onChange={(e) => setGuestFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="bg-transparent border border-gray-600 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                      We'll use this information to send your booking confirmation and appointment reminders.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setStep(1)}
                    className="w-[30%] bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinueFromContact}
                    className="w-[70%] bg-[#35514e] text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Continue to Review
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600">Already have an account?</p>
                  <Link 
                    href="/login"
                    className="text-[#35514e] font-bold hover:underline"
                  >
                    Sign In Instead
                  </Link>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Review Your Booking</h2>
                  <p className="text-gray-600 mb-6">Please verify all details before confirming</p>
                </div>

                {/* Appointment Details */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Appointment Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-bold text-gray-900">{new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-bold text-gray-900">{selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stylist</p>
                      <p className="font-bold text-gray-900">{selectedEmployee === null ? 'Any Available' : 
                        employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                        employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-bold text-gray-900">{getTotalDuration()} minutes</p>
                    </div>
                  </div>

                  <div className="border-t border-purple-200 pt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Services:</p>
                    {getSelectedServicesDetails().map((service) => (
                      <div key={service.id} className="flex justify-between text-sm text-gray-700">
                        <span>{service.name}</span>
                        <span className="font-bold">${service.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-purple-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Guest Details */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Your Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-bold text-gray-900">{guestFullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-bold text-gray-900">{guestEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-bold text-gray-900">{guestPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    ✓ A confirmation email will be sent to <strong>{guestEmail}</strong>
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setStep(2)}
                    className="w-[30%] bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={isBooking}
                    className="w-[70%] bg-[#35514e] text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBooking ? '⏳ Confirming...' : '✓ Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center space-y-8 py-12">
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-600 text-lg">Your appointment has been successfully booked.</p>
                </div>

                <div className="bg-gray-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                  <p className="text-gray-700">
                    📧 A confirmation email has been sent to <strong>{guestEmail}</strong>
                  </p>
                  <p className="text-gray-700">
                    Please check your inbox (and spam folder) for the confirmation details.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Your Appointment</h3>
                  <div className="space-y-2 text-gray-700">
                    <p>📅 <strong>{parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}</strong></p>
                    <p>🕐 <strong>{selectedTime}</strong></p>
                    <p>💇 <strong>{selectedEmployee === null ? 'Any Available Stylist' : 
                      employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                      employees.find(e => e.id === selectedEmployee)?.user?.lastName}</strong></p>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link
                    href="/"
                    className="px-8 py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                  >
                    Back to Home
                  </Link>
                  {!accountCreated && (
                    <button
                      onClick={() => setShowCreateAccount(!showCreateAccount)}
                      className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                    >
                      Create an Account
                    </button>
                  )}
                </div>

                {/* Create Account Form */}
                {showCreateAccount && !accountCreated && (
                  <div className="bg-gray-50 border-l-4 border-[#35514e] rounded-r-lg p-6 text-left space-y-4 max-w-md mx-auto">
                    <div>
                      <p className="font-semibold text-[#35514e]">Set a password for {guestEmail}</p>
                      <p className="text-sm text-gray-600 mt-1">Create a password to manage your appointments online.</p>
                    </div>

                    {accountError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {accountError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">New Password *</label>
                      <input
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#35514e] text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        value={accountConfirmPassword}
                        onChange={(e) => setAccountConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#35514e] text-gray-900"
                      />
                    </div>

                    <button
                      onClick={handleCreateAccount}
                      disabled={isCreatingAccount}
                      className="w-full py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-[#2a413e] disabled:bg-gray-400 transition-colors"
                    >
                      {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                )}

                {/* Account Created Confirmation */}
                {accountCreated && (
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-6 text-left max-w-md mx-auto">
                    <p className="font-semibold text-green-800">Account created successfully!</p>
                    <p className="text-sm text-green-700 mt-1">
                      A confirmation email has been sent to <strong>{guestEmail}</strong>. You can now sign in to manage your appointments.
                    </p>
                    <Link
                      href="/login"
                      className="inline-block mt-3 px-6 py-2 bg-[#35514e] text-white rounded-lg font-bold hover:bg-[#2a413e] transition-colors text-sm"
                    >
                      Sign In Now
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
