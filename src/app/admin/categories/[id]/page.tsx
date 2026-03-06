'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
  services?: any[];
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Category>({
    id: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await api.get(`/services/categories/${categoryId}`);
        setFormData(res.data);
      } catch (error) {
        console.error('Failed to fetch category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/services/categories/${categoryId}`, {
        name: formData.name,
        description: formData.description,
      });
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Failed to update category:', error);
      alert(error.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if ((formData.services?.length || 0) > 0) {
      alert('Cannot delete category with existing services. Please remove all services from this category first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await api.delete(`/services/categories/${categoryId}`);
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Loading category...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Category</h1>
            <p className="text-slate-600 mt-1">Update category details</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={(formData.services?.length || 0) > 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              (formData.services?.length || 0) > 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Delete Category
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Category Name *
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

            {formData.services && formData.services.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Services in this category:</strong> {formData.services.length}
                </p>
                <ul className="mt-2 text-sm text-blue-800">
                  {formData.services.map((service: any) => (
                    <li key={service.id}>• {service.name}</li>
                  ))}
                </ul>
              </div>
            )}

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
