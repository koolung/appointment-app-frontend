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
            new Date(selectedDate).toDateString() === cellDate.toDateString();
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
                  ? 'bg-purple-600 text-white font-bold shadow-md'
                  : isToday
                  ? 'bg-purple-100 text-purple-900 border-2 border-purple-400'
                  : 'text-gray-700 bg-white hover:bg-purple-50 border border-gray-200'
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
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
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
    const startTime = new Date(`${selectedDate}T${selectedTime}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
            <h1 className="text-4xl font-bold mb-2">Book an Appointment</h1>
            <p className="text-purple-100">Guest Booking - No Account Required</p>
          </div>

          {/* Booking Warning Message */}
          {bookingWarningMessage && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mx-8 mt-6">
              <div className="flex gap-3">
                <span className="text-amber-600 text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-800">{bookingWarningMessage}</p>
                </div>
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
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > idx ? 'bg-purple-600' : 'bg-gray-300'
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
                  <p className="text-gray-600 mb-6">Choose the services you'd like to book</p>
                </div>

                {/* Service Categories Sidebar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Categories */}
                  <div className="md:col-span-1">
                    <div className="sticky top-4 space-y-2">
                      {getServiceCategories().map((category: string) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                            selectedCategory === category
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                          <span className="text-sm ml-2">
                            ({getServicesByCategory(category).length})
                          </span>
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
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                ⏱️ {service.baseDuration} minutes
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-purple-600">${service.price.toFixed(2)}</p>
                              {selectedServices.includes(service.id) && (
                                <p className="text-purple-600 text-lg">✓</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary and Continue Button */}
                {selectedServices.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Services Selected:</p>
                    <div className="space-y-1">
                      {getSelectedServicesDetails().map((service) => (
                        <p key={service.id} className="text-sm text-blue-800">
                          • {service.name} ({service.baseDuration} mins) - ${service.price.toFixed(2)}
                        </p>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-blue-900 mt-2">
                      Total: {getTotalDuration()} minutes | ${getTotalPrice().toFixed(2)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleContinueFromServices}
                  disabled={selectedServices.length === 0}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Date & Time
                </button>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Services Selected:</p>
                  <div className="space-y-1">
                    {getSelectedServicesDetails().map((service) => (
                      <p key={service.id} className="text-sm text-blue-800">
                        • {service.name} ({service.baseDuration} mins) - ${service.price.toFixed(2)}
                      </p>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-blue-900 mt-2">
                    Total: {getTotalDuration()} minutes
                  </p>
                </div>

                {/* Employee Selection */}
                <div>
                  <label className="block text-gray-900 font-bold mb-3">Select Stylist</label>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedEmployee === null
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="font-bold text-gray-900">🎯 No Preference</p>
                      <p className="text-sm text-gray-600 mt-1">Any available stylist</p>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {employees.filter(emp => emp.isActive !== false).map((emp) => {
                        const canProvide = canEmployeeProvidServices(emp.id);
                        const availCount = employeeAvailabilityCount[emp.id] || 0;

                        return (
                          <div
                            key={emp.id}
                            onClick={() => canProvide && setSelectedEmployee(emp.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              !canProvide
                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                : selectedEmployee === emp.id
                                ? 'border-purple-600 bg-purple-50 cursor-pointer'
                                : 'border-gray-200 hover:border-purple-300 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className={`font-bold ${!canProvide ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {emp.user?.firstName} {emp.user?.lastName}
                                </p>
                              </div>
                              {selectedDate && (
                                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                                  availCount > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {availCount} slots
                                </div>
                              )}
                            </div>

                            {selectedServices.length > 0 && !canProvide && (
                              <p className="text-xs text-gray-600 font-semibold mb-2">
                                ⚠️ Doesn't offer one or more selected services
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
                          📅 Selected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-lg font-medium">
                          {selectedEmployee === null
                            ? `${availableSlots.length} merged slots`
                            : `${employeeAvailabilityCount[selectedEmployee] ?? 0} slots`
                          }
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">📅 Select a date at least 1 day in advance. You can book up to 60 days ahead.</p>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-gray-900 font-bold">Select Time</label>
                        {nextAvailableSlot && (
                          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                            ✓ Next available: {new Date(nextAvailableSlot).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        )}
                      </div>

                      {isLoading ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-2">⏳ Loading available times...</p>
                          <div className="flex justify-center gap-1">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div>
                          <div className="text-sm text-gray-600 mb-4">
                            📅 {new Date(selectedDate).toLocaleDateString('en-US', { 
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
                                      ? 'border-purple-600 bg-purple-600 text-white shadow-lg'
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
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Appointment Summary:</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>📅 {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                    <p>⏰ {selectedTime}</p>
                    <p>💇 {selectedEmployee === null ? 'Any Available Stylist' : 
                      employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                      employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                    <p>⏱️ {getTotalDuration()} minutes | ${getTotalPrice().toFixed(2)}</p>
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

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    🔒 We'll use this information to send your booking confirmation and appointment reminders.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleContinueFromContact}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                  >
                    Continue to Review
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600">Already have an account?</p>
                  <Link 
                    href="/login"
                    className="text-purple-600 font-bold hover:underline"
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

                <div className="flex gap-4">
                  <button
                    onClick={handleBooking}
                    disabled={isBooking}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isBooking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Back
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

                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
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
                    <p>📅 <strong>{new Date(selectedDate).toLocaleDateString('en-US', { 
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
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                  >
                    Back to Home
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Create an Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
