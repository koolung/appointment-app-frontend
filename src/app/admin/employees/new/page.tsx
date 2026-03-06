'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    hourlyRate: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/services/categories');
        setCategories(res.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    setLoading(true);

    try {
      await api.post('/employees', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        serviceIds: selectedServices,
      });
      alert(`✓ ${formData.firstName} ${formData.lastName} has been created successfully!\n\nNext step: Add availability to this employee so clients can book appointments.`);
      router.push('/admin/employees');
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      alert(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Add New Employee</h1>
          <p className="text-slate-600 mt-1">Create a new employee account and assign services</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
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
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

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
                  placeholder="25.00"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Services section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Services</h3>
              <p className="text-sm text-slate-600 mb-4">Select which services this employee can provide</p>
              
              {loadingServices ? (
                <div className="text-slate-600 text-sm">Loading services...</div>
              ) : categories.length === 0 ? (
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                {loading ? 'Creating...' : 'Create Employee'}
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
