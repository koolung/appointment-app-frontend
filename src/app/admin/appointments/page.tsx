'use client';

import { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingSource?: string;
  notes?: string;
  client?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
  };
  employee?: {
    id: string;
    isActive?: boolean;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  services?: Array<{
    id: string;
    service?: {
      id: string;
      name: string;
    };
  }>;
  changes?: Array<{
    id: string;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    changedBy?: string;
    createdAt: string;
  }>;
}

interface Employee {
  id: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface Service {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'list';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Filter states
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    clientPhone: string;
    startTime: string;
    endTime: string;
    employeeId: string;
    serviceIds: string[];
    status: string;
    notes: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    discount: '',
    discountType: 'percentage' as 'percentage' | 'dollar',
    tax: 14,
    tip: '',
    paymentType: 'cash' as 'cash' | 'card' | 'giftcard' | 'membership',
    soldBy: '',
  });
  const [isViewingPayment, setIsViewingPayment] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [appointmentPayment, setAppointmentPayment] = useState<any>(null);
  const [editPaymentData, setEditPaymentData] = useState({
    discount: '',
    discountType: 'percentage' as 'percentage' | 'dollar',
    tax: 14,
    tip: '',
    paymentType: 'cash' as 'cash' | 'card' | 'giftcard' | 'membership',
    soldBy: '',
  });
  const [timeRangeStart, setTimeRangeStart] = useState<number>(9); // 9 AM default
  const [timeRangeEnd, setTimeRangeEnd] = useState<number>(17); // 5 PM default

  // Quick add appointment state
  const [quickAddSlot, setQuickAddSlot] = useState<{ date: Date; hour: number; minute: number; employeeId: string } | null>(null);
  const [quickAddClientFirstName, setQuickAddClientFirstName] = useState('');
  const [quickAddClientLastName, setQuickAddClientLastName] = useState('');
  const [quickAddClientEmail, setQuickAddClientEmail] = useState('');
  const [quickAddClientPhone, setQuickAddClientPhone] = useState('');
  const [quickAddServiceIds, setQuickAddServiceIds] = useState<string[]>([]);
  const [quickAddDuration, setQuickAddDuration] = useState(60);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
  const [employeeWorkingHours, setEmployeeWorkingHours] = useState<Record<string, { startTime: string; endTime: string } | null>>({});
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedExistingClient, setSelectedExistingClient] = useState<any>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const BOOKING_SOURCES = ['ADMIN', 'WEB', 'PHONE', 'AI'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };

    if (showClientSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showClientSuggestions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptsRes, empsRes, secsRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/employees?isActive=true'),
          api.get('/services'),
        ]);
        setAppointments(aptsRes.data || []);
        setEmployees(empsRes.data || []);
        setServices(secsRes.data || []);
        // Set default to all employees (no filter)
        setSelectedEmployeeId(null);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadAppointments = async () => {
    try {
      const aptsRes = await api.get('/appointments');
      setAppointments(aptsRes.data || []);
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
    }
  };

  // Fetch payment details when appointment is selected
  useEffect(() => {
    if (selectedAppointment) {
      const fetchPayment = async () => {
        try {
          const response = await api.get(`/payments/appointment/${selectedAppointment.id}`);
          const payments = response.data;
          if (payments && payments.length > 0) {
            setAppointmentPayment(payments[0]);
          } else {
            setAppointmentPayment(null);
          }
        } catch (error) {
          console.error('Failed to fetch payment:', error);
          setAppointmentPayment(null);
        }
      };
      fetchPayment();
    } else {
      setAppointmentPayment(null);
    }
  }, [selectedAppointment?.id]);

  const applyAllFilters = (apts: Appointment[]) => {
    let filtered = apts;

    // Filter out appointments from inactive employees
    filtered = filtered.filter((apt) => apt.employee?.isActive !== false);

    // Filter by employee (except in list view with no specific employee selected)
    if (selectedEmployeeId && viewMode !== 'list') {
      filtered = filtered.filter((apt) => apt.employee?.id === selectedEmployeeId);
    } else if (selectedEmployeeId && viewMode === 'list') {
      // In list view, allow filtering by specific employee or show all
      filtered = filtered.filter((apt) => apt.employee?.id === selectedEmployeeId);
    }

    // Filter by service
    if (selectedServiceId) {
      filtered = filtered.filter((apt) =>
        apt.services?.some((s) => s.service?.id === selectedServiceId)
      );
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter((apt) => apt.status === selectedStatus);
    }

    // Search by client name or phone
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((apt) => {
        const clientName = `${apt.client?.user?.firstName || ''} ${apt.client?.user?.lastName || ''}`.toLowerCase();
        const clientPhone = (apt.client?.user?.phone || '').toLowerCase();
        return clientName.includes(query) || clientPhone.includes(query);
      });
    }

    return filtered;
  };

  const filterByEmployee = (apts: Appointment[]) => {
    return applyAllFilters(apts);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (date: Date) => {
    const filtered = filterByEmployee(appointments);
    return filtered.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getSelectedDateAppointments = () => {
    if (!selectedDate) return [];
    return getAppointmentsForDate(selectedDate);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const formatForDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStartEditAppointment = () => {
    if (!selectedAppointment) return;
    
    // Initialize form data from selected appointment
    const startDateTime = new Date(selectedAppointment.startTime);
    const endDateTime = new Date(selectedAppointment.endTime);
    
    setEditFormData({
      clientFirstName: selectedAppointment.client?.user?.firstName || '',
      clientLastName: selectedAppointment.client?.user?.lastName || '',
      clientEmail: selectedAppointment.client?.user?.email || '',
      clientPhone: selectedAppointment.client?.user?.phone || '',
      startTime: formatForDatetimeLocal(startDateTime),
      endTime: formatForDatetimeLocal(endDateTime),
      employeeId: selectedAppointment.employee?.id || '',
      serviceIds: selectedAppointment.services?.map(s => s.service?.id).filter(Boolean) as string[] || [],
      status: selectedAppointment.status || 'PENDING',
      notes: selectedAppointment.notes || '',
    });
    setIsEditingAppointment(true);
  };

  const handleViewPayment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await api.get(`/payments/appointment/${selectedAppointment.id}`);
      const payments = response.data;
      if (payments && payments.length > 0) {
        // Get the most recent payment
        const payment = payments[0];
        setAppointmentPayment(payment);
        setEditPaymentData({
          discount: '',
          discountType: 'percentage' as 'percentage' | 'dollar',
          tax: 14,
          tip: '',
          paymentType: 'cash' as 'cash' | 'card' | 'giftcard' | 'membership',
          soldBy: '',
        });
        setIsViewingPayment(true);
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      alert('Failed to fetch payment details');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingAppointment(false);
    setEditFormData(null);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment || !editFormData) return;

    setIsSavingEdit(true);
    try {
      const response = await api.put(`/appointments/${selectedAppointment.id}`, {
        clientFirstName: editFormData.clientFirstName,
        clientLastName: editFormData.clientLastName,
        clientEmail: editFormData.clientEmail,
        clientPhone: editFormData.clientPhone,
        startTime: new Date(editFormData.startTime).toISOString(),
        endTime: new Date(editFormData.endTime).toISOString(),
        employeeId: editFormData.employeeId,
        serviceIds: editFormData.serviceIds,
        status: editFormData.status,
        notes: editFormData.notes,
      });

      // Update local state
      const updatedAppointment = response.data;
      setAppointments(appointments.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
      setSelectedAppointment(updatedAppointment);
      setIsEditingAppointment(false);
      setEditFormData(null);
      alert('Appointment updated successfully!');
    } catch (error: any) {
      console.error('Failed to update appointment:', error);
      alert(error.response?.data?.message || 'Failed to update appointment');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    if (!confirm(`Are you sure you want to delete this appointment for ${selectedAppointment.client?.user?.firstName} ${selectedAppointment.client?.user?.lastName}?`)) {
      return;
    }

    try {
      await api.delete(`/appointments/${selectedAppointment.id}`);
      
      // Remove from local state
      setAppointments(appointments.filter(apt => apt.id !== selectedAppointment.id));
      setSelectedAppointment(null);
      alert('Appointment deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete appointment:', error);
      alert(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const searchClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClientSearchResults([]);
      setShowClientSuggestions(false);
      return;
    }

    try {
      // Search through appointments to find clients matching the search term
      const searchLower = searchTerm.toLowerCase();
      const matches = new Map<string, any>();

      appointments.forEach((apt) => {
        if (apt.client?.user) {
          const fullName = `${apt.client.user.firstName || ''} ${apt.client.user.lastName || ''}`.toLowerCase();
          const phone = (apt.client.user.phone || '').toLowerCase();
          const email = (apt.client.user.email || '').toLowerCase();

          if (
            fullName.includes(searchLower) ||
            phone.includes(searchLower) ||
            email.includes(searchLower)
          ) {
            if (!matches.has(apt.client.user.email || apt.client.id)) {
              matches.set(apt.client.user.email || apt.client.id, {
                id: apt.client.id,
                firstName: apt.client.user.firstName,
                lastName: apt.client.user.lastName,
                email: apt.client.user.email,
                phone: apt.client.user.phone,
              });
            }
          }
        }
      });

      setClientSearchResults(Array.from(matches.values()));
      setShowClientSuggestions(matches.size > 0);
    } catch (error) {
      console.error('Failed to search clients:', error);
    }
  };

  const handleSelectClient = (client: any) => {
    setQuickAddClientFirstName(client.firstName || '');
    setQuickAddClientLastName(client.lastName || '');
    setQuickAddClientEmail(client.email || '');
    setQuickAddClientPhone(client.phone || '');
    setSelectedExistingClient(client);
    setShowClientSuggestions(false);
  };

  const handleQuickAddAppointment = async () => {
    if (!quickAddSlot || quickAddServiceIds.length === 0) {
      alert('Please select at least one service');
      return;
    }

    if (!quickAddClientFirstName.trim() || !quickAddClientLastName.trim()) {
      alert('Please enter client first and last name');
      return;
    }

    setIsCreatingAppointment(true);
    try {
      const startTime = new Date(
        quickAddSlot.date.getFullYear(),
        quickAddSlot.date.getMonth(),
        quickAddSlot.date.getDate(),
        quickAddSlot.hour,
        quickAddSlot.minute
      );

      const endTime = new Date(startTime.getTime() + quickAddDuration * 60 * 1000);

      // If an existing client was selected, use their ID; otherwise use temp marker
      const clientIdToSend = selectedExistingClient?.id || 'temp-admin-booking';

      const response = await api.post('/appointments', {
        clientId: clientIdToSend,
        employeeId: quickAddSlot.employeeId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        serviceIds: quickAddServiceIds,
        bookingSource: 'ADMIN',
        clientFirstName: quickAddClientFirstName,
        clientLastName: quickAddClientLastName,
        clientEmail: quickAddClientEmail,
        clientPhone: quickAddClientPhone,
        notes: '',
      });

      // Refresh appointments
      const aptsRes = await api.get('/appointments');
      setAppointments(aptsRes.data || []);

      // Clear the quick add form
      setQuickAddSlot(null);
      setQuickAddClientFirstName('');
      setQuickAddClientLastName('');
      setQuickAddClientEmail('');
      setQuickAddClientPhone('');
      setQuickAddServiceIds([]);
      setQuickAddDuration(60);
      setSelectedExistingClient(null);
      setShowClientSuggestions(false);

      alert('Appointment created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create appointment');
      console.error('Failed to create appointment:', error);
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  const getWeekAppointments = () => {
    if (!selectedDate) return [];
    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const filtered = filterByEmployee(appointments);
    return filtered.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= weekStart && aptDate < weekEnd;
    });
  };

  const getDayAppointments = () => {
    if (!selectedDate) return [];
    let dayAppointments = getAppointmentsForDate(selectedDate);
    
    // In daily view, hide cancelled appointments by default unless specifically selected
    if (selectedStatus !== 'CANCELLED') {
      dayAppointments = dayAppointments.filter(apt => apt.status !== 'CANCELLED');
    }
    
    return dayAppointments;
  };

  const isTimeSlotAvailable = (employeeId: string, hour: number, minute: number): boolean => {
    const workingHours = employeeWorkingHours[employeeId];
    
    if (!workingHours) {
      return false; // No working hours data = not available
    }

    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

    const slotMinutesFromMidnight = hour * 60 + minute;
    const workStartMinutes = startHour * 60 + startMinute;
    const workEndMinutes = endHour * 60 + endMinute;

    return slotMinutesFromMidnight >= workStartMinutes && slotMinutesFromMidnight < workEndMinutes;
  };

  const calculateDayTimeRange = async () => {
    if (!selectedDate) {
      setTimeRangeStart(9);
      setTimeRangeEnd(17);
      return;
    }

    try {
      // If no employees loaded yet, use default
      if (!employees || employees.length === 0) {
        // console.log('No employees loaded yet, using default 9-17');
        setTimeRangeStart(9);
        setTimeRangeEnd(17);
        return;
      }

      // Fetch availability for all employees for the selected date
      let earliestStart = 24;
      let latestEnd = 0;
      const dateStr = selectedDate.toISOString().split('T')[0];

      // console.log('Fetching availability for', employees.length, 'employees on', dateStr);

      for (const employee of employees) {
        try {
          const response = await api.get(`/availability/working-hours/${employee.id}`, {
            params: {
              date: dateStr,
            },
          });

          const workingHours = response.data;
          // console.log('Employee', employee.id, 'availability:', workingHours);
          
          if (workingHours && workingHours.startTime && workingHours.endTime) {
            const [startHour] = workingHours.startTime.split(':').map(Number);
            const [endHour] = workingHours.endTime.split(':').map(Number);
            
            // console.log('Parsed hours:', startHour, 'to', endHour);
            
            earliestStart = Math.min(earliestStart, startHour);
            latestEnd = Math.max(latestEnd, endHour);
          }
        } catch (empError) {
          // console.error('Error fetching availability for employee', employee.id, empError);
          // Continue with next employee
        }
      }

      // console.log('Final range:', earliestStart, 'to', latestEnd);

      if (earliestStart !== 24 && latestEnd !== 0) {
        const newStart = Math.max(0, earliestStart - 1);
        const newEnd = Math.min(24, latestEnd + 1);
        // console.log('Setting time range to', newStart, 'to', newEnd);
        setTimeRangeStart(newStart);
        setTimeRangeEnd(newEnd);
      } else {
        // No availability data, use default
        // console.log('No availability data found, using default 9-17');
        setTimeRangeStart(9);
        setTimeRangeEnd(17);
      }
    } catch (error) {
      console.error('Failed to fetch employee availability:', error);
      // Default to standard business hours on error
      setTimeRangeStart(9);
      setTimeRangeEnd(17);
    }
  };

  // Calculate time range whenever selected date changes (based on all employees' availability)
  useEffect(() => {
    calculateDayTimeRange();
  }, [selectedDate, employees]);

  // Update current time line position
  useEffect(() => {
    const updateCurrentTimePosition = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const rangeStartMinutes = timeRangeStart * 60;
      
      // Check if selectedDate is today
      const isToday = selectedDate && 
        selectedDate.getDate() === now.getDate() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear();
      
      // Only show the line if current time is within the visible range AND we're viewing today
      if (isToday && currentMinutes >= rangeStartMinutes && currentMinutes < timeRangeEnd * 60) {
        const offsetFromRangeStart = currentMinutes - rangeStartMinutes;
        const topOffset = (offsetFromRangeStart / 15) * 24; // 24px per 15min slot
        setCurrentTimePosition(topOffset);
      } else {
        setCurrentTimePosition(null);
      }
    };

    updateCurrentTimePosition();
    
    // Update every minute
    const interval = setInterval(updateCurrentTimePosition, 60000);
    
    return () => clearInterval(interval);
  }, [timeRangeStart, timeRangeEnd, selectedDate]);

  // Fetch working hours for each employee
  useEffect(() => {
    const fetchEmployeeWorkingHours = async () => {
      if (!selectedDate || !employees.length) {
        setEmployeeWorkingHours({});
        return;
      }

      const dateStr = selectedDate.toISOString().split('T')[0];
      const hours: Record<string, { startTime: string; endTime: string } | null> = {};

      for (const employee of employees) {
        try {
          const response = await api.get(`/availability/working-hours/${employee.id}`, {
            params: { date: dateStr },
          });
          hours[employee.id] = response.data;
        } catch (error) {
          console.error('Error fetching working hours for employee', employee.id, error);
          hours[employee.id] = null;
        }
      }

      setEmployeeWorkingHours(hours);
    };

    fetchEmployeeWorkingHours();
  }, [selectedDate, employees]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const todayDate = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === todayDate.getDate() &&
      date.getMonth() === todayDate.getMonth() &&
      date.getFullYear() === todayDate.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const bookingSourceLabels: Record<string, string> = {
    ADMIN: '👨‍💼 Admin',
    WEB: '🌐 Website',
    PHONE: '☎️ Phone',
    AI: '🤖 AI',
  };

  const calculatePaymentTotals = () => {
    if (!selectedAppointment?.services) return { subtotal: 0, discount: 0, taxAmount: 0, tip: 0, total: 0 };
    
    const subtotal = selectedAppointment.services.reduce((sum, s) => sum + ((s as any).price || 0), 0);
    const discountValue = paymentData.discount === '' ? 0 : parseFloat(paymentData.discount as any) || 0;
    const tipValue = paymentData.tip === '' ? 0 : parseFloat(paymentData.tip as any) || 0;
    const discountAmount = paymentData.discountType === 'percentage' 
      ? (subtotal * discountValue) / 100 
      : discountValue;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = (discountedSubtotal * paymentData.tax) / 100;
    const total = discountedSubtotal + taxAmount + tipValue;
    
    return {
      subtotal,
      discount: discountAmount,
      taxAmount,
      tip: tipValue,
      total,
    };
  };

  const handleTakePayment = async () => {
    if (!selectedAppointment) return;
    
    const totals = calculatePaymentTotals();
    
    try {
      // Send payment to backend using api client
      const response = await api.post('/payments', {
        appointmentId: selectedAppointment.id,
        amount: totals.total,
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountType: paymentData.discountType,
        tax: paymentData.tax,
        taxAmount: totals.taxAmount,
        tip: totals.tip,
        paymentType: paymentData.paymentType,
        soldBy: paymentData.soldBy,
        status: 'completed',
      });

      alert(`✓ Payment recorded successfully!\n\nAmount: $${totals.total.toFixed(2)}\nPayment Type: ${paymentData.paymentType.toUpperCase()}\n\nThank you!`);
      
      // Close payment modal and appointment modal, then refresh
      setIsPaymentModalOpen(false);
      setSelectedAppointment(null);
      
      // Refresh appointments list to update status if needed
      loadAppointments();
      
      // Reset payment data
      setPaymentData({
        discount: '',
        discountType: 'percentage' as 'percentage' | 'dollar',
        tax: 14,
        tip: '',
        paymentType: 'cash' as 'cash' | 'card' | 'giftcard' | 'membership',
        soldBy: '',
      });
    } catch (error) {
      console.error('Failed to record payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error recording payment: ${errorMessage}`);
    }
  };

  return (
    <AdminLayout>
      {/* Appointment Detail Modal - Editable */}
      {selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto pt-8"
          onClick={(e) => {
            // Close modal only if clicking on the backdrop itself, not the modal content
            if (e.target === e.currentTarget) {
              setSelectedAppointment(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-start justify-between border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold">{isEditingAppointment ? 'Edit Appointment' : 'Appointment Details'}</h2>
                <p className="text-blue-100 mt-1">
                  {new Date(selectedAppointment.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  handleCancelEdit();
                }}
                className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {isEditingAppointment && editFormData ? (
                <>
                  {/* Client Contact Info - EDIT MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">👤 Client Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={editFormData.clientFirstName}
                          onChange={(e) => setEditFormData({...editFormData, clientFirstName: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editFormData.clientLastName}
                          onChange={(e) => setEditFormData({...editFormData, clientLastName: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.clientEmail}
                          onChange={(e) => setEditFormData({...editFormData, clientEmail: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editFormData.clientPhone}
                          onChange={(e) => setEditFormData({...editFormData, clientPhone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info - EDIT MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">📅 Appointment Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={editFormData.startTime}
                          onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          value={editFormData.endTime}
                          onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Staff Member</label>
                        <select
                          value={editFormData.employeeId}
                          onChange={(e) => setEditFormData({...editFormData, employeeId: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Staff Member</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.user?.firstName} {emp.user?.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Services</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-300 rounded-lg p-3">
                          {services.map((service) => (
                            <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editFormData.serviceIds.includes(service.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFormData({...editFormData, serviceIds: [...editFormData.serviceIds, service.id]});
                                  } else {
                                    setEditFormData({...editFormData, serviceIds: editFormData.serviceIds.filter(id => id !== service.id)});
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-slate-700">{service.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes - EDIT MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">📝 Booking Notes</h3>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      placeholder="Add special requests or notes..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Action Buttons - EDIT MODE */}
                  <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateAppointment}
                      disabled={isSavingEdit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Client Contact Info - VIEW MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">👤 Client Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Name</p>
                        <p className="font-semibold text-slate-900">
                          {selectedAppointment.client?.user?.firstName}{' '}
                          {selectedAppointment.client?.user?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-semibold text-slate-900">
                          {selectedAppointment.client?.user?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-semibold text-slate-900">
                          {selectedAppointment.client?.user?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Client ID</p>
                        <p className="font-mono text-sm text-slate-900">{selectedAppointment.client?.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info - VIEW MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">📅 Appointment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Date & Time</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(selectedAppointment.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(selectedAppointment.endTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Staff Member</p>
                        <p className="font-semibold text-slate-900">
                          {selectedAppointment.employee?.user?.firstName}{' '}
                          {selectedAppointment.employee?.user?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Services</p>
                        <p className="font-semibold text-slate-900">
                          {selectedAppointment.services && selectedAppointment.services.length > 0
                            ? selectedAppointment.services.map((s) => s.service?.name).join(', ')
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            statusColors[selectedAppointment.status] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {selectedAppointment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Source & Notes - VIEW MODE */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">📝 Booking Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600">Booking Source</p>
                        <p className="font-semibold text-slate-900">
                          {bookingSourceLabels[selectedAppointment.bookingSource || 'ADMIN'] ||
                            selectedAppointment.bookingSource}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Notes / Special Requests</p>
                        <p className="font-semibold text-slate-900 whitespace-pre-wrap">
                          {selectedAppointment.notes || 'No notes'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change History - VIEW MODE */}
                  {selectedAppointment.changes && selectedAppointment.changes.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-3">📋 Change History</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {[...selectedAppointment.changes].reverse().map((change) => (
                          <div key={change.id} className="bg-white p-3 rounded border border-slate-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-slate-900 capitalize">
                                  {change.fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                  Changed from{' '}
                                  <span className="font-mono bg-red-50 px-2 py-1 rounded">
                                    {change.oldValue || 'empty'}
                                  </span>{' '}
                                  to{' '}
                                  <span className="font-mono bg-green-50 px-2 py-1 rounded">
                                    {change.newValue || 'empty'}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right text-sm text-slate-500">
                                <p>{change.changedBy || 'System'}</p>
                                <p>
                                  {new Date(change.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button - VIEW MODE */}
                  <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
                    <button
                      onClick={handleStartEditAppointment}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      ✏️ Edit Appointment
                    </button>
                    <button
                      onClick={handleDeleteAppointment}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => {
                        if (appointmentPayment) {
                          setIsViewingPayment(true);
                        } else {
                          setIsPaymentModalOpen(true);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      💳 {appointmentPayment ? 'View Payment' : 'Take Payment'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto pt-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPaymentModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-start justify-between border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold">Process Payment</h2>
                <p className="text-green-100 mt-1">
                  {selectedAppointment.client?.user ? `${selectedAppointment.client.user.firstName} ${selectedAppointment.client.user.lastName}` : 'Client'}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white hover:text-green-100 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Services Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">🛎️ Services</h3>
                <div className="space-y-2">
                  {selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                    selectedAppointment.services.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-900 font-medium">{service.service?.name || 'Service'}</span>
                        <span className="text-slate-700 font-semibold">${((service as any).price || 0).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No services added</p>
                  )}
                </div>
              </div>

              {/* Subtotal */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-semibold">Subtotal:</span>
                  <span className="text-blue-700 font-bold text-lg">
                    ${calculatePaymentTotals().subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Discount Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">💰 Discount</h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={paymentData.discount}
                      onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={paymentData.discountType}
                      onChange={(e) => setPaymentData({ ...paymentData, discountType: e.target.value as 'percentage' | 'dollar' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="dollar">Dollar ($)</option>
                    </select>
                  </div>
                  <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-semibold min-w-24 text-right">
                    -${calculatePaymentTotals().discount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tax Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">📊 Tax</h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={paymentData.tax}
                      onChange={(e) => setPaymentData({ ...paymentData, tax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="14"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold min-w-24 text-right">
                    +${calculatePaymentTotals().taxAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">💵 Tip</h3>
                <input
                  type="number"
                  value={paymentData.tip}
                  onChange={(e) => setPaymentData({ ...paymentData, tip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Sold By Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">👤 Sold By</h3>
                <select
                  value={paymentData.soldBy}
                  onChange={(e) => setPaymentData({ ...paymentData, soldBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a stylist...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.firstName} {emp.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">🏦 Payment Method</h3>
                <select
                  value={paymentData.paymentType}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentType: e.target.value as 'cash' | 'card' | 'giftcard' | 'membership' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">💰 Cash</option>
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="giftcard">🎁 Gift Card</option>
                  <option value="membership">⭐ Membership Points</option>
                </select>
              </div>

              {/* Totals Summary */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Subtotal:</span>
                    <span className="text-slate-900 font-semibold">${calculatePaymentTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Discount:</span>
                    <span className="text-orange-700 font-semibold">-${calculatePaymentTotals().discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Tax ({paymentData.tax}%):</span>
                    <span className="text-red-700 font-semibold">+${calculatePaymentTotals().taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Tip:</span>
                    <span className="text-blue-700 font-semibold">+${calculatePaymentTotals().tip.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-green-900">Total:</span>
                    <span className="text-3xl font-bold text-green-700">
                      ${calculatePaymentTotals().total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakePayment}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors text-lg"
                >
                  ✓ Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {isViewingPayment && appointmentPayment && selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto pt-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsViewingPayment(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-start justify-between border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold">{isEditingPayment ? 'Edit Payment' : 'Payment Details'}</h2>
                <p className="text-blue-100 mt-1">
                  {selectedAppointment.client?.user ? `${selectedAppointment.client.user.firstName} ${selectedAppointment.client.user.lastName}` : 'Client'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewingPayment(false);
                  setIsEditingPayment(false);
                }}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {!isEditingPayment ? (
                <>
                  {/* View Mode */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">💳 Payment Information</h3>
                    <div className="space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-semibold">${appointmentPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-semibold capitalize">{appointmentPayment.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-semibold">{appointmentPayment.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Date:</span>
                        <span className="font-semibold">
                          {new Date(appointmentPayment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsViewingPayment(false)}
                      className="flex-1 px-4 py-3 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 font-medium transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditingPayment(true)}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                    >
                      ✏️ Edit Payment
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode - Payment Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Amount:</span>
                        <span className="text-green-700 font-bold text-lg">${appointmentPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Status:</span>
                        <span className="text-green-700 font-semibold">{appointmentPayment.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">🏦 Payment Method</h3>
                    <select
                      value={editPaymentData.paymentType}
                      onChange={(e) => setEditPaymentData({ ...editPaymentData, paymentType: e.target.value as 'cash' | 'card' | 'giftcard' | 'membership' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">💰 Cash</option>
                      <option value="card">💳 Credit/Debit Card</option>
                      <option value="giftcard">🎁 Gift Card</option>
                      <option value="membership">⭐ Membership Points</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingPayment(false)}
                      className="flex-1 px-4 py-3 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!appointmentPayment) return;
                        try {
                          await api.put(`/payments/${appointmentPayment.id}`, {
                            method: editPaymentData.paymentType === 'cash' ? 'CASH' : editPaymentData.paymentType === 'card' ? 'CARD' : 'CARD',
                          });
                          alert('Payment updated successfully');
                          setIsEditingPayment(false);
                          // Refresh payment data
                          const response = await api.get(`/payments/appointment/${selectedAppointment.id}`);
                          const payments = response.data;
                          if (payments && payments.length > 0) {
                            setAppointmentPayment(payments[0]);
                          }
                        } catch (error) {
                          console.error('Failed to update payment:', error);
                          alert('Failed to update payment');
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                    >
                      ✓ Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Appointment Modal */}
      {quickAddSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-start justify-between border-b border-slate-200 z-10">
              <div>
                <h2 className="text-2xl font-bold">Add Appointment</h2>
                <p className="text-green-100 mt-1">
                  {quickAddSlot.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })} at {String(quickAddSlot.hour).padStart(2, '0')}:{String(quickAddSlot.minute).padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={() => setQuickAddSlot(null)}
                className="text-white hover:bg-green-800 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Client First Name - with search */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  First Name * (Type to search existing clients)
                </label>
                <div ref={clientDropdownRef} className="relative">
                  <input
                    type="text"
                    value={quickAddClientFirstName}
                    onChange={(e) => {
                      setQuickAddClientFirstName(e.target.value);
                      searchClients(e.target.value);
                    }}
                    placeholder="Client first name or search"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                  
                  {/* Client Suggestions Dropdown */}
                  {showClientSuggestions && clientSearchResults.length > 0 && (
                    <div className="absolute bg-white border border-slate-300 rounded-lg mt-1 w-80 max-h-40 overflow-y-auto shadow-lg z-50">
                      {clientSearchResults.map((client, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-100 border-b border-slate-200 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-xs text-slate-600">
                            {client.email && `${client.email}`}
                            {client.email && client.phone && ' • '}
                            {client.phone && `${client.phone}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={quickAddClientLastName}
                  onChange={(e) => {
                    setQuickAddClientLastName(e.target.value);
                    searchClients(e.target.value);
                  }}
                  placeholder="Client last name or search"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Email (Optional - Type to search)
                </label>
                <input
                  type="email"
                  value={quickAddClientEmail}
                  onChange={(e) => {
                    setQuickAddClientEmail(e.target.value);
                    if (e.target.value.trim()) {
                      searchClients(e.target.value);
                    }
                  }}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              {/* Client Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Phone (Optional - Type to search)
                </label>
                <input
                  type="tel"
                  value={quickAddClientPhone}
                  onChange={(e) => {
                    setQuickAddClientPhone(e.target.value);
                    if (e.target.value.trim()) {
                      searchClients(e.target.value);
                    }
                  }}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Services (Select at least one)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickAddServiceIds.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setQuickAddServiceIds([...quickAddServiceIds, service.id]);
                          } else {
                            setQuickAddServiceIds(
                              quickAddServiceIds.filter((id) => id !== service.id)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={quickAddDuration}
                  onChange={(e) => setQuickAddDuration(Number(e.target.value))}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setQuickAddSlot(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAddAppointment}
                  disabled={isCreatingAppointment || quickAddServiceIds.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isCreatingAppointment ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header with View Toggle */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Appointment Calendar</h1>
            <p className="text-slate-600 mt-1">Manage all salon appointments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(viewMode === 'daily' || viewMode === 'weekly' || viewMode === 'monthly') && (
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.firstName} {emp.user?.lastName}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search by Client Name/Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Search Client
              </label>
              <input
                type="text"
                placeholder="Name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filter by Employee */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Employee
              </label>
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.firstName} {emp.user?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Service */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Service
              </label>
              <select
                value={selectedServiceId || ''}
                onChange={(e) => setSelectedServiceId(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Services</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Status
              </label>
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{viewMode === 'daily' ? 'All Active Statuses' : 'All Statuses'}</option>
                {APPOINTMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedServiceId(null);
                  setSelectedStatus(null);
                  setSelectedEmployeeId(employees.length > 0 ? employees[0].id : null);
                }}
                className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Daily View */}
        {viewMode === 'daily' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select a date'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          (selectedDate || new Date()).getTime() - 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          (selectedDate || new Date()).getTime() + 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    Next →
                  </button>
                  <input
                    type="date"
                    value={
                      selectedDate
                        ? selectedDate.toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    }
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  {/* Timeline Calendar */}
                  <div className="flex gap-2 min-w-max">
                    {/* Time Column */}
                    <div className="flex flex-col w-20 flex-shrink-0 mt-[-10px]">
                      <div className="h-16 border-b border-slate-200"></div>
                      {Array.from({ length: (timeRangeEnd - timeRangeStart) * 4 }).map((_, idx) => {
                        const hour = timeRangeStart + Math.floor(idx / 4);
                        const isHour = idx % 4 === 0;
                        return (
                          <div
                            key={idx}
                            className={`h-6   flex items-start justify-end pr-2 text- ${
                              isHour ? 'font-bold text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {isHour && `${hour}:00`}
                            {idx % 4 === 2 && `${hour}:30`}
                            {idx % 4 === 1 && `${hour}:15`}
                            {idx % 4 === 3 && `${hour}:45`}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stylist Columns */}
                    {employees.length === 0 ? (
                      <div className="text-center py-8 text-slate-600">No stylists available</div>
                    ) : (
                      employees.map((emp) => {
                        const empName = emp.user
                          ? `${emp.user.firstName} ${emp.user.lastName}`
                          : 'Unassigned';
                        
                        // Get appointments for this employee on this day
                        const empAppointments = getDayAppointments().filter(
                          (apt) => apt.employee?.id === emp.id
                        );

                        return (
                          <div
                            key={emp.id}
                            className="flex flex-col border-l border-slate-200"
                          >
                            {/* Stylist Header */}
                            <div className="h-16 px-4 py-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100 flex flex-col justify-center w-48 flex-shrink-0">
                              <div className="font-bold text-slate-900 text-sm">
                                {empName}
                              </div>
                              <div className="text-xs text-slate-600">
                                Working Hours
                              </div>
                            </div>

                            {/* Time Slots */}
                            <div className="relative">
                              {Array.from({ length: (timeRangeEnd - timeRangeStart) * 4 }).map((_, idx) => {
                                const hour = timeRangeStart + Math.floor(idx / 4);
                                const minute = (idx % 4) * 15;
                                const isAvailable = isTimeSlotAvailable(emp.id, hour, minute);
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      if (selectedDate && isAvailable) {
                                        setQuickAddSlot({
                                          date: selectedDate,
                                          hour,
                                          minute,
                                          employeeId: emp.id,
                                        });
                                      }
                                    }}
                                    className={`h-6 w-48 border-t border-slate-100 border-r border-slate-200 transition-colors ${
                                      isAvailable
                                        ? 'hover:bg-blue-50 cursor-pointer'
                                        : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                    title={isAvailable ? 'Click to add appointment' : 'Not available'}
                                  ></div>
                                );
                              })}

                              {/* Current time indicator */}
                              {currentTimePosition !== null && (
                                <div
                                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                                  style={{
                                    top: `${currentTimePosition}px`,
                                  }}
                                ></div>
                              )}

                              {/* Appointments */}
                              {empAppointments.map((apt) => {
                                const startTime = new Date(apt.startTime);
                                const endTime = new Date(apt.endTime);
                                const startMinutes =
                                  startTime.getHours() * 60 + startTime.getMinutes();
                                const durationMinutes =
                                  (endTime.getTime() - startTime.getTime()) / (60 * 1000);
                                
                                // Calculate offset relative to the start of time range
                                const rangeStartMinutes = timeRangeStart * 60;
                                const offsetFromRangeStart = startMinutes - rangeStartMinutes;
                                const topOffset = (offsetFromRangeStart / 15) * 24; // 24px per 15min slot
                                const height = (durationMinutes / 15) * 24;

                                const clientName = apt.client?.user
                                  ? `${apt.client.user.firstName} ${apt.client.user.lastName}`
                                  : 'Unknown';

                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={`absolute left-0 right-0 mx-1 rounded p-2 text-xs cursor-pointer overflow-hidden hover:shadow-lg transition-shadow ${
                                      statusColors[apt.status] || 'bg-slate-100 text-slate-800'
                                    }`}
                                    style={{
                                      top: `${topOffset}px`,
                                      height: `${Math.max(height, 24)}px`,
                                    }}
                                    title={clientName}
                                  >
                                    <div className="font-semibold truncate">
                                      {startTime.getHours()}:{String(startTime.getMinutes()).padStart(2, '0')}
                                    </div>
                                    <div className="truncate text-xs opacity-80">
                                      {clientName}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly View */}
        {viewMode === 'weekly' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Week of{' '}
                  {selectedDate
                    ? getWeekStart(selectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          (selectedDate || new Date()).getTime() - 7 * 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    ← Prev Week
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    This Week
                  </button>
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          (selectedDate || new Date()).getTime() + 7 * 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    Next Week →
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                    const dayDate = new Date(
                      getWeekStart(selectedDate || new Date()).getTime() +
                        idx * 24 * 60 * 60 * 1000
                    );
                    const dayAppointments = getAppointmentsForDate(dayDate);

                    return (
                      <div key={day} className="border border-slate-200 rounded-lg p-4">
                        <div className="font-semibold text-slate-900 mb-3">
                          {day}, {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        {dayAppointments.length === 0 ? (
                          <div className="text-sm text-slate-600">No appointments</div>
                        ) : (
                          <div className="space-y-2">
                            {dayAppointments
                              .sort(
                                (a, b) =>
                                  new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                              )
                              .map((apt) => {
                                const startTime = new Date(apt.startTime);
                                const endTime = new Date(apt.endTime);
                                const clientName = apt.client?.user
                                  ? `${apt.client.user.firstName} ${apt.client.user.lastName}`
                                  : 'Unknown';

                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={`text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                                      statusColors[apt.status] ||
                                      'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {startTime.getHours()}:
                                    {String(startTime.getMinutes()).padStart(2, '0')} - {clientName}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
              <div className="space-y-6">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={previousMonth}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={nextMonth}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-slate-600 py-2 text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((date, index) => {
                    const appointmentsForDay = date
                      ? getAppointmentsForDate(date)
                      : [];
                    const isCurrentDay = isToday(date);
                    const isCurrentSelected = isSelected(date);

                    return (
                      <button
                        key={index}
                        onClick={() => date && setSelectedDate(date)}
                        className={`min-h-24 p-2 rounded-lg border-2 transition-all text-left ${
                          date
                            ? isCurrentSelected
                              ? 'border-blue-500 bg-blue-50'
                              : isCurrentDay
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                            : 'bg-slate-50'
                        }`}
                        disabled={!date}
                      >
                        {date && (
                          <div className="space-y-1">
                            <div
                              className={`text-sm font-semibold ${
                                isCurrentDay ? 'text-blue-600' : 'text-slate-900'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {appointmentsForDay
                                .slice(0, 2)
                                .map((apt) => (
                                  <div
                                    key={apt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAppointment(apt);
                                    }}
                                    className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                                  >
                                    {new Date(apt.startTime).getHours()}:
                                    {String(
                                      new Date(apt.startTime).getMinutes()
                                    ).padStart(2, '0')}
                                  </div>
                                ))}
                              {appointmentsForDay.length > 2 && (
                                <div className="text-xs text-slate-600 px-1">
                                  +{appointmentsForDay.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar - Selected Date Details */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 h-fit">
              <h3 className="font-bold text-slate-900 mb-4">
                {selectedDate
                  ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                  : 'Select a date'}
              </h3>

              {selectedDate && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-slate-600">Loading...</div>
                  ) : getSelectedDateAppointments().length === 0 ? (
                    <div className="text-sm text-slate-600">
                      No appointments scheduled
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getSelectedDateAppointments().map((apt) => {
                        const startTime = new Date(apt.startTime);
                        const endTime = new Date(apt.endTime);
                        const clientName = apt.client?.user
                          ? `${apt.client.user.firstName} ${apt.client.user.lastName}`
                          : 'Unknown';
                        const employeeName = apt.employee?.user
                          ? `${apt.employee.user.firstName} ${apt.employee.user.lastName}`
                          : 'Unassigned';

                        return (
                          <div
                            key={apt.id}
                            className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                          >
                            <div className="font-semibold text-sm text-slate-900">
                              {startTime.getHours()}:
                              {String(startTime.getMinutes()).padStart(2, '0')} -{' '}
                              {endTime.getHours()}:
                              {String(endTime.getMinutes()).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              <div>
                                <strong>Client:</strong> {clientName}
                              </div>
                              <div>
                                <strong>Staff:</strong> {employeeName}
                              </div>
                            </div>
                            <div className="mt-2">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded ${
                                  statusColors[apt.status] ||
                                  'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">All Appointments</h2>

              {loading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-slate-600">No appointments scheduled</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Staff
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .sort(
                          (a, b) =>
                            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                        )
                        .map((apt) => {
                          const startTime = new Date(apt.startTime);
                          const endTime = new Date(apt.endTime);
                          const clientName = apt.client?.user
                            ? `${apt.client.user.firstName} ${apt.client.user.lastName}`
                            : 'Unknown';
                          const employeeName = apt.employee?.user
                            ? `${apt.employee.user.firstName} ${apt.employee.user.lastName}`
                            : 'Unassigned';
                          const duration = Math.round(
                            (endTime.getTime() - startTime.getTime()) / (60 * 1000)
                          );

                          return (
                            <tr
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className="border-b border-slate-200 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 text-sm text-slate-900">
                                {startTime.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                {startTime.getHours()}:{String(startTime.getMinutes()).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900">{clientName}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">{employeeName}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{duration} min</td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`font-medium px-3 py-1 rounded text-xs ${
                                    statusColors[apt.status] || 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
