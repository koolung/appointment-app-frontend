'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    baseDuration: '30',
    categoryId: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/services/categories');
        setCategories(res.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/services', {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        baseDuration: parseInt(formData.baseDuration),
        categoryId: formData.categoryId || null,
      });
      router.push('/admin/services');
    } catch (error: any) {
      console.error('Failed to create service:', error);
      alert(error.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Add New Service</h1>
          <p className="text-slate-600 mt-1">Create a new salon service</p>
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
                placeholder="e.g., Hair Cut, Coloring, Styling"
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
                placeholder="Describe the service..."
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
                  placeholder="0.00"
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
                  value={formData.categoryId}
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

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                {loading ? 'Creating...' : 'Create Service'}
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
