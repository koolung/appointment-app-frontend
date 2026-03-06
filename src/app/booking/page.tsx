'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

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
    
    // Disable past dates and dates beyond 60 days
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

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full">
      {/* Month Navigation */}
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

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
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

export default function BookingPage() {
  const { user } = useAuthStore();
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
  const [clientNotes, setClientNotes] = useState('');
  const [consentToPolicies, setConsentToPolicies] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [nextAvailableSlot, setNextAvailableSlot] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  // Step state (0 = services, 1 = employee/date/time, 2 = review, 3 = success)
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Detect user's timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);

    if (!user) {
      router.push('/login');
      return;
    }
    loadSettings();
    loadServices();
    loadEmployees();
  }, [user, router]);

  useEffect(() => {
    // Set default category when services load
    if (services.length > 0 && !selectedCategory) {
      const getServiceCategories = () => {
        const categories = [...new Set(services.map(s => s.category?.name).filter(Boolean))];
        return categories.sort() as string[];
      };
      const categories = getServiceCategories();
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [services, selectedCategory]);

  useEffect(() => {
    // Auto-select today's date when step 1 is reached and no date is selected
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
      // Continue without warning message if settings fetch fails
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
    if (!selectedDate) return;
    
    // If no employee selected (No Preference), merge slots from all employees
    if (selectedEmployee === null) {
      try {
        setIsLoading(true);
        const allSlots: any[] = [];
        const slotSet = new Set<string>(); // To track unique times

        // Fetch slots for all employees
        for (const emp of employees) {
          try {
            const response = await api.get(`/availability/slots/${emp.id}`, {
              params: {
                date: selectedDate,
                duration: getTotalDuration(),
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

        // Mark the first future slot as next available
        const now = new Date();
        allSlots.forEach((slot: any, idx: number) => {
          if (idx === 0 && new Date(slot.start) > now) {
            slot.isNextAvailable = true;
          } else {
            delete slot.isNextAvailable;
          }
        });

        setAvailableSlots(allSlots);
        const nextSlot = allSlots.find((slot: any) => slot.isNextAvailable);
        setNextAvailableSlot(nextSlot?.start || null);
      } catch (error) {
        console.error('Failed to load merged available slots:', error);
        setAvailableSlots([]);
        setNextAvailableSlot(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Original logic for specific employee selection
    try {
      setIsLoading(true);
      const response = await api.get(`/availability/slots/${selectedEmployee}`, {
        params: {
          date: selectedDate,
          duration: getTotalDuration(),
          timezone: userTimezone,
        },
      });
      const slots = response.data || [];
      setAvailableSlots(slots);
      
      // Find next available slot
      const nextSlot = slots.find((slot: any) => slot.isNextAvailable);
      setNextAvailableSlot(nextSlot?.start || null);
    } catch (error) {
      console.error('Failed to load available slots:', error);
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
      // Only check availability for active employees
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
    if (step === 1 && selectedDate) {
      checkEmployeeAvailability();
    }
  }, [selectedDate, step]);

  useEffect(() => {
    // Load slots when employee is selected OR when a date is selected (auto-show No Preference slots)
    if (step === 1 && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedEmployee, selectedDate, step]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedServicesDetails = (): Service[] => {
    return services.filter((s) => selectedServices.includes(s.id));
  };

  const getTotalPrice = (): number => {
    return getSelectedServicesDetails().reduce((sum, s) => sum + s.price, 0);
  };

  const getTotalDuration = (): number => {
    const srvs = getSelectedServicesDetails();
    if (srvs.length === 0) return 0;
    const totalTime = srvs.reduce((sum, s) => sum + s.baseDuration, 0);
    const maxBuffer = Math.max(...srvs.map((s) => s.bufferBefore + s.bufferAfter));
    return totalTime + maxBuffer;
  };

  const getCategorizedServices = () => {
    const grouped: Record<string, Service[]> = {};
    services.forEach((service) => {
      const catName = service.category?.name;
      if (catName) {
        if (!grouped[catName]) {
          grouped[catName] = [];
        }
        grouped[catName].push(service);
      }
    });
    return grouped;
  };

  const getServicesForCategory = (categoryName: string | null): Service[] => {
    if (!categoryName) return services;
    return services.filter(s => s.category?.name === categoryName);
  };

  const getEmployeeSpecialties = (employeeId: string): Service[] => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp || !emp.employeeServices) return [];
    return emp.employeeServices
      .map((es) => es.service)
      .filter((s) => s !== undefined) as Service[];
  };

  const canEmployeeProvidServices = (employeeId: string): boolean => {
    const employeeServices = getEmployeeSpecialties(employeeId);
    const selectedServiceIds = new Set(selectedServices);
    return selectedServices.every((serviceId) =>
      employeeServices.some((s) => s.id === serviceId)
    );
  };


const handleBooking = async () => {
  if (!selectedServices.length || selectedEmployee === undefined || !selectedDate || !selectedTime) {
    alert('Please complete all selections');
    return;
  }

  if (!consentToPolicies) {
    alert('Please agree to the terms and conditions before booking');
    return;
  }

  // Validate that the selected time is not in the past
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

    const response = await api.post('/appointments', {
      userId: user?.id,
      employeeId: selectedEmployee,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      serviceIds: selectedServices,
      bookingSource: 'WEB',
      clientTimezone: userTimezone,
      notes: clientNotes || undefined,
    });

    setStep(3);
  } catch (error: any) {
    console.error('Booking failed:', error);
    alert(error.response?.data?.message || 'Booking failed. Please try again.');
  } finally {
    setIsBooking(false);
  }
}; // <-- This closing brace was missing

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
            <h1 className="text-4xl font-bold mb-2">Book an Appointment</h1>
            <p className="text-purple-100">Choose your services and preferred time</p>
          </div>

          {/* Booking Warning Message */}
          {bookingWarningMessage && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mx-8 mt-6">
              <div className="flex gap-3">
                <span className="text-amber-600 text-xl">⚠️</span>
                <p className="text-amber-900 text-sm">{bookingWarningMessage}</p>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          {step < 3 && (
            <div className="flex justify-between px-8 py-6 bg-slate-50 border-b">
              {['Services', 'Details', 'Review'].map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      idx <= step
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={idx <= step ? 'text-purple-600 font-semibold' : 'text-slate-600'}>
                    {label}
                  </span>
                  {idx < 2 && (
                    <div className={`h-1 w-12 ml-2 ${idx < step ? 'bg-purple-600' : 'bg-slate-300'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-8">
            {/* Step 0: Service Selection */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Select Services</h2>
                  <p className="text-gray-600 mb-6">Choose one or more services for your appointment</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-96">
                  {/* Categories Sidebar */}
                  <div className="md:col-span-1">
                    <div className="sticky top-4 space-y-2">
                      {Object.keys(getCategorizedServices()).map((categoryName) => (
                        <button
                          key={categoryName}
                          onClick={() => setSelectedCategory(categoryName)}
                          className={`w-full text-left px-4 border-2 border-[#fdb5ff] py-3 rounded-lg font-medium transition-all ${
                            selectedCategory === categoryName
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{categoryName}</span>
                            <span className={`text-sm font-semibold ${
                              selectedCategory === categoryName ? 'text-purple-100' : 'text-gray-600'
                            }`}>
                              {getCategorizedServices()[categoryName].length}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="md:col-span-2">
                    {selectedCategory && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedCategory}</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {getServicesForCategory(selectedCategory).map((service) => (
                            <div
                              key={service.id}
                              onClick={() => toggleService(service.id)}
                              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedServices.includes(service.id)
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0 flex-shrink-0 ${
                                    selectedServices.includes(service.id)
                                      ? 'bg-purple-600 border-purple-600'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedServices.includes(service.id) && (
                                    <span className="text-white text-sm">✓</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-sm text-gray-900">{service.name}</h3>
                                </div>
                              </div>

                              {/* Service Quick Info */}
                              <div className="mt-2 pl-9 space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Duration:</span>
                                  <span className="font-semibold text-gray-900">{service.baseDuration} min</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Price:</span>
                                  <span className="font-bold text-purple-600">${service.price.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Description Toggle */}
                              {service.description && (
                                <div className="mt-1 pl-9">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedService(
                                        expandedService === service.id ? null : service.id
                                      );
                                    }}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                  >
                                    {expandedService === service.id ? '▼ Hide' : '▶ View'} Details
                                  </button>
                                  {expandedService === service.id && (
                                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-2">Selected Services</h3>
                    {getSelectedServicesDetails().map((service) => (
                      <div key={service.id} className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>{service.name}</span>
                        <span>${service.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-purple-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total:</span>
                      <span className="text-purple-600 text-lg">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Total Duration: {getTotalDuration()} minutes
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <button
                  onClick={() => setStep(1)}
                  disabled={selectedServices.length === 0}
                  className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Details
                </button>
              </div>
            )}

            {/* Step 1: Employee, Date & Time Selection */}
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
                    {/* No Preference Option */}
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

                    {/* Individual Employee Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {employees.filter(emp => emp.isActive !== false).map((emp) => {
                        const specialties = getEmployeeSpecialties(emp.id);
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
                            {/* Name and Availability Badge */}
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

                            {/* Service Compatibility Warning */}
                            {selectedServices.length > 0 && !canProvide && (
                              <p className="text-xs text-gray-600 font-semibold mb-2">
                                ⚠️ Doesn't offer one or more selected services
                              </p>
                            )}

                            {/* Specialties */}
                            {specialties.length > 0 && (
                              <div className="mt-3 text-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedEmployee(
                                      expandedEmployee === emp.id ? null : emp.id
                                    );
                                  }}
                                  disabled={!canProvide}
                                  className={`font-medium ${
                                    !canProvide
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-purple-600 hover:text-purple-700'
                                  }`}
                                >
                                  {expandedEmployee === emp.id ? '▼' : '▶'} Specialties
                                </button>
                                {expandedEmployee === emp.id && (
                                  <div className="mt-2 space-y-1">
                                    {specialties.map((service) => (
                                      <p
                                        key={service.id}
                                        className={`text-xs ${
                                          selectedServices.includes(service.id)
                                            ? 'text-purple-700 font-semibold'
                                            : canProvide
                                            ? 'text-gray-600'
                                            : 'text-gray-400'
                                        }`}
                                      >
                                        • {service.name}
                                        {selectedServices.includes(service.id) && ' ✓'}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
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
                    
                    {/* Interactive Calendar */}
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

                    {/* Selected Date Info */}
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
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots.map((slot: any, idx: number) => {
                            const timeStr = new Date(slot.start).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            });
                            const isSelected = selectedTime === timeStr;
                            const isNextAvail = slot.isNextAvailable;
                            const isPastSlot = new Date(slot.start) <= new Date();

                            return (
                              <button
                                key={idx}
                                onClick={() => !isPastSlot && setSelectedTime(timeStr)}
                                disabled={isPastSlot}
                                className={`p-2 rounded-lg border-2 font-semibold transition-all text-sm ${
                                  isPastSlot
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg'
                                    : isNextAvail
                                    ? 'border-green-500 bg-green-50 text-gray-900 hover:bg-green-100'
                                    : 'border-gray-300 hover:border-purple-500 text-gray-900'
                                }`}
                                title={isPastSlot ? 'This time has already passed' : isNextAvail ? 'Next available slot' : undefined}
                              >
                                {isNextAvail && !isPastSlot && <span className="block text-xs">⭐</span>}
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

                {/* Appointment Summary Card */}
                {selectedDate && selectedTime && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 sticky bottom-0">
                    <h3 className="font-bold text-gray-900 mb-3">📋 Your Appointment</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs font-semibold">DATE</p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold">TIME</p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold">DURATION</p>
                        <p className="text-gray-900 font-semibold">{getTotalDuration()} min</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold">TIMEZONE</p>
                        <p className="text-gray-900 font-semibold text-xs">{userTimezone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Review Booking
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review & Confirm */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Confirm Your Booking</h2>
                  <p className="text-gray-600 mb-6">Review your appointment details and add any special requests</p>
                </div>

                {/* Main Appointment Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Appointment Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Services & Price */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Services</p>
                        <div className="space-y-2">
                          {getSelectedServicesDetails().map((service) => (
                            <div key={service.id} className="flex justify-between items-center bg-white rounded p-2">
                              <span className="text-sm font-medium text-gray-900">{service.name}</span>
                              <span className="text-sm font-semibold text-purple-600">${service.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-purple-200 mt-3 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-900">Total Price</span>
                          <span className="text-lg font-bold text-purple-600">${getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Appointment Details</p>
                        <div className="bg-white rounded space-y-2 p-3">
                          <div>
                            <p className="text-xs text-gray-500">Stylist</p>
                            <p className="font-semibold text-gray-900">
                              {selectedEmployee === null
                                ? '🎯 No Preference (Any Available)'
                                : `${employees.find((e) => e.id === selectedEmployee)?.user?.firstName} ${employees.find((e) => e.id === selectedEmployee)?.user?.lastName}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="font-semibold text-gray-900">{selectedTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-semibold text-gray-900">{getTotalDuration()} minutes</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Timezone</p>
                            <p className="font-semibold text-gray-900">{userTimezone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Notes/Requests */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <label className="block text-gray-900 font-bold mb-3">
                    💬 Special Requests or Notes (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Let us know about any specific preferences, allergies, or requests for your appointment.
                  </p>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="E.g., I prefer to use specific products, I have sensitive skin, I'd like to try a new style, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2">{clientNotes.length}/500 characters</p>
                </div>

                {/* Terms & Conditions */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">📋 Terms & Conditions</h3>
                  
                  <div className="space-y-3 mb-4 text-sm text-gray-700 max-h-48 overflow-y-auto">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Cancellation Policy</p>
                      <p>Cancellations must be made at least 24 hours before your appointment. Cancellations within 24 hours may incur a cancellation fee.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">No-Show Policy</p>
                      <p>If you do not show up for your appointment without prior notice, a no-show fee may be charged to your account.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Payment Terms</p>
                      <p>Payment is due at the time of service. We accept all major credit cards and cash.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Health & Safety</p>
                      <p>By booking, you confirm that you are healthy and have no contagious conditions. You also confirm you have disclosed any relevant allergies or medical conditions.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Privacy</p>
                      <p>Your personal information will be kept confidential and used only for appointment management and communication purposes.</p>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentToPolicies}
                      onChange={(e) => setConsentToPolicies(e.target.checked)}
                      className="w-5 h-5 mt-0.5 cursor-pointer border-gray-300 rounded text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <strong>cancellation policy</strong>, <strong>no-show policy</strong>, 
                      and <strong>terms of service</strong>. I have disclosed all relevant health information 
                      and allergies.
                      <span className="text-red-600 font-bold ml-1">*</span>
                    </span>
                  </label>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      setConsentToPolicies(false);
                    }}
                    className="flex-1 bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || !consentToPolicies}
                    className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBooking ? '⏳ Confirming...' : '✓ Confirm & Book'}
                  </button>
                </div>

                {!consentToPolicies && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      ⚠️ You must agree to the terms and conditions to complete your booking.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="text-6xl animate-bounce">✓</div>
                <h2 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
                <p className="text-gray-600 text-lg">
                  Your appointment has been successfully booked. A confirmation email has been sent to you.
                </p>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 text-left space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    📋 Your Appointment Details
                  </h3>
                  
                  {/* Services */}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Services</p>
                    <div className="space-y-1">
                      {getSelectedServicesDetails().map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{service.name}</span>
                          <span className="text-gray-900 font-semibold">${service.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-green-200 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stylist:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedEmployee === null
                          ? '🎯 No Preference (Any Available)'
                          : `${employees.find((e) => e.id === selectedEmployee)?.user?.firstName} ${employees.find((e) => e.id === selectedEmployee)?.user?.lastName}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold text-gray-900">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">{getTotalDuration()} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-bold text-purple-600 text-lg">${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Client Notes Display */}
                  {clientNotes && (
                    <div className="border-t border-green-200 pt-4">
                      <p className="text-sm font-semibold text-gray-600 uppercase mb-2">💬 Your Requests</p>
                      <p className="text-sm text-gray-700 bg-white rounded p-3 italic">"{clientNotes}"</p>
                    </div>
                  )}
                </div>

                {/* Confirmation Actions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    ✉️ A confirmation email with all details has been sent. You can also manage your appointment from your dashboard.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => router.push('/booking')}
                      className="flex-1 bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Book Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
