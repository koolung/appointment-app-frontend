'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  baseDuration: number;
  isActive: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/categories'),
      ]);
      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      alert(error.response?.data?.message || 'Failed to delete service');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group services by category
  const groupedServices = categories.map(cat => ({
    category: cat,
    services: services.filter(s => s.categoryId === cat.id),
  }));

  // Add services without category
  const uncategorized = services.filter(s => !s.categoryId);
  if (uncategorized.length > 0) {
    groupedServices.push({
      category: { id: 'uncategorized', name: 'Uncategorized' },
      services: uncategorized,
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Service Management</h1>
            <p className="text-slate-600 mt-1">Manage your salon services and pricing</p>
          </div>
          <Link
            href="/admin/services/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Service
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-600">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p>No services found</p>
            <Link href="/admin/services/new" className="text-blue-600 hover:underline mt-2 inline-block">
              Create your first service
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedServices.map(group => (
              group.services.length > 0 && (
                <div key={group.category.id}>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                    {group.category.name}
                    <span className="text-sm font-normal text-slate-600 ml-2">
                      ({group.services.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900">{service.name}</h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              service.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">{service.description}</p>

                        <div className="flex items-center justify-between py-3 border-t border-slate-200 pt-4">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              ${service.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-600">{service.baseDuration} min</p>
                          </div>
                          <div className="space-x-2">
                            <Link
                              href={`/admin/services/${service.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
