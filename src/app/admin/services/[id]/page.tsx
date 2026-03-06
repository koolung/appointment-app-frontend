'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
}

interface Category {
  id: string;
  name: string;
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Service>({
    id: '',
    name: '',
    description: '',
    price: 0,
    baseDuration: 30,
    isActive: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serviceRes, categoriesRes] = await Promise.all([
          api.get(`/services/${serviceId}`),
          api.get('/services/categories'),
        ]);
        setFormData(serviceRes.data);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [serviceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/services/${serviceId}`, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        baseDuration: parseInt(formData.baseDuration.toString()),
        isActive: formData.isActive,
        categoryId: formData.categoryId || null,
      });
      router.push('/admin/services');
    } catch (error) {
      console.error('Failed to update service:', error);
      alert('Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/services/${serviceId}`);
      router.push('/admin/services');
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Loading service...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Service</h1>
            <p className="text-slate-600 mt-1">Update salon service details</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Service
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="baseDuration"
                  value={formData.baseDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Category
              </label>
              {loadingCategories ? (
                <div className="text-slate-600 text-sm">Loading categories...</div>
              ) : (
                <select
                  name="categoryId"
                  value={formData.categoryId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
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
