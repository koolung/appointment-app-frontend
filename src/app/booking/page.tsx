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
  const [isCategoryNavOpen, setIsCategoryNavOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);
  const [isServicesReminderExpanded, setIsServicesReminderExpanded] = useState(false);
  const [isSummaryDetailExpanded, setIsSummaryDetailExpanded] = useState(false);
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

  const getServiceCategories = () => {
    const categories = [...new Set(services.map(s => s.category?.name).filter(Boolean))];
    return categories.sort() as string[];
  };

  const getServicesByCategory = (category: string | null) => {
    if (!category) return [];
    return services.filter(s => s.category?.name === category);
  };

  const handleContinueFromServices = () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }
    setStep(1);
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
          <div className="bg-white text-gray-900 p-8 border-t-xl">
            <h1 className="text-4xl font-bold mb-2">Book an Appointment</h1>
            <p className="text-gray-600">Choose your services and preferred time</p>
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
              {['Services', 'Date & Time', 'Review', 'Success'].map((label, idx) => (
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
                  {idx < 3 && (
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
                          onClick={() => toggleService(service.id)}
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

            {/* Step 1: Employee, Date & Time Selection */}
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
                  onClick={() => setStep(2)}
                  disabled={!selectedTime}
                  className="w-full py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Review Booking
                </button>
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
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSummaryDetailExpanded ? 'max-h-96' : 'max-h-0'}`}>
                      <div className="px-4 pb-4 space-y-1 text-sm text-[#35514e]">
                        {getSelectedServicesDetails().map((service) => (
                          <p key={service.id}>• {service.name} - ${service.price.toFixed(2)}</p>
                        ))}
                        <p className="font-semibold mt-2">Total: ${getTotalPrice().toFixed(2)}</p>
                        <p className="mt-2">{parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                        })}</p>
                        <p>{selectedTime}</p>
                        <p><i className="fi fi-rs-user"></i> {selectedEmployee === null ? 'Any Available Stylist' : 
                          employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                          employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                        <p><i className="fi fi-rr-clock"></i> {getTotalDuration()} minutes</p>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: always visible */}
                  <div className="hidden md:block p-4">
                    <p className="font-semibold text-[#35514e] mb-3">Appointment Summary:</p>
                    <div className="space-y-1 text-sm text-[#35514e]">
                      {getSelectedServicesDetails().map((service) => (
                        <p key={service.id}>• {service.name} - ${service.price.toFixed(2)}</p>
                      ))}
                      <p className="font-semibold mt-2">Total: ${getTotalPrice().toFixed(2)}</p>
                      <p className="mt-2">{parseLocalDate(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })}</p>
                      <p>{selectedTime}</p>
                      <p><i className="fi fi-rs-user"></i> {selectedEmployee === null ? 'Any Available Stylist' : 
                        employees.find(e => e.id === selectedEmployee)?.user?.firstName + ' ' + 
                        employees.find(e => e.id === selectedEmployee)?.user?.lastName}</p>
                      <p><i className="fi fi-rr-clock"></i> {getTotalDuration()} minutes</p>
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
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setStep(1);
                      setConsentToPolicies(false);
                    }}
                    className="w-[30%] bg-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || !consentToPolicies}
                    className="w-[70%] bg-[#35514e] text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
              <div className="text-center space-y-8 py-12">
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-600 text-lg">Your appointment has been successfully booked.</p>
                </div>

                <div className="bg-gray-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                  <p className="text-gray-700">
                    📧 A confirmation email has been sent to your email.
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
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 bg-[#35514e] text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/booking')}
                    className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Book Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
