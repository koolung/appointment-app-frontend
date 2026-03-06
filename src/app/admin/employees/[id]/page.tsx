'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Service {
  id: string;
  name: string;
  price: number;
  baseDuration: number;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

interface EmployeeService {
  id: string;
  serviceId: string;
  service: Service;
}

interface Employee {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  position: string;
  hourlyRate: number;
  isActive: boolean;
  employeeServices?: EmployeeService[];
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [formData, setFormData] = useState<Employee>({
    id: '',
    user: {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    position: '',
    hourlyRate: 0,
    isActive: true,
    employeeServices: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, catRes] = await Promise.all([
          api.get(`/employees/${employeeId}`),
          api.get('/services/categories'),
        ]);
        
        setFormData(empRes.data);
        setCategories(catRes.data);
        
        // Set selected services from employee's current services
        if (empRes.data.employeeServices && Array.isArray(empRes.data.employeeServices)) {
          setSelectedServices(empRes.data.employeeServices.map((es: EmployeeService) => es.serviceId));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('user.')) {
      const fieldName = name.replace('user.', '');
      setFormData({
        ...formData,
        user: {
          ...formData.user,
          [fieldName]: value,
        },
      });
    } else if (name === 'hourlyRate') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else if (name === 'isActive') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/employees/${employeeId}`, {
        position: formData.position,
        hourlyRate: formData.hourlyRate,
        isActive: formData.isActive,
        serviceIds: selectedServices,
      });
      router.push('/admin/employees');
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      alert(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/employees/${employeeId}`);
      router.push('/admin/employees');
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      alert(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Loading employee...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Employee</h1>
            <p className="text-slate-600 mt-1">Update employee information and services</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Employee
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-only user info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Account Information (Read-only)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600">First Name</label>
                  <p className="text-slate-900 font-medium">{formData.user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Last Name</label>
                  <p className="text-slate-900 font-medium">{formData.user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Email</label>
                  <p className="text-slate-900 font-medium">{formData.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Phone</label>
                  <p className="text-slate-900 font-medium">{formData.user.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Editable employee info */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Position & Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="e.g., Hairstylist, Manager"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-slate-900 font-medium">Active</span>
              </label>
            </div>

            {/* Services section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Services</h3>
              <p className="text-sm text-slate-600 mb-4">Select which services this employee can provide</p>
              
              {categories.length === 0 ? (
                <div className="text-slate-600 text-sm">No services available</div>
              ) : (
                <div>
                  {/* Select All / Clear All buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const allServiceIds = categories.flatMap(cat => cat.services.map(s => s.id));
                        setSelectedServices(allServiceIds);
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <h4 className="font-medium text-slate-900">{category.name}</h4>
                        <span className={`text-slate-600 transition-transform ${
                          expandedCategories[category.id] ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </button>
                      {expandedCategories[category.id] && (
                        <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-2">
                          {category.services.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="w-4 h-4 rounded border-slate-300 mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-slate-900 font-medium">{service.name}</div>
                                <div className="text-sm text-slate-600">
                                  ${service.price.toFixed(2)} • {service.baseDuration} min
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
