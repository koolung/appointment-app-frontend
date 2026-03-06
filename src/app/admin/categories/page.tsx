'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
  services?: any[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/services/categories');
      setCategories(res.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, hasServices: boolean) => {
    if (hasServices) {
      alert('Cannot delete category with existing services. Please remove all services from this category first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await api.delete(`/services/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Service Categories</h1>
            <p className="text-slate-600 mt-1">Organize your services by category</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Category
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <p>No categories found</p>
              <Link href="/admin/categories/new" className="text-blue-600 hover:underline mt-2 inline-block">
                Create your first category
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Services</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{category.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 text-sm">{category.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {category.services?.length || 0} services
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id, (category.services?.length || 0) > 0)}
                        className={`text-sm ${
                          (category.services?.length || 0) > 0
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-red-600 hover:underline'
                        }`}
                        disabled={(category.services?.length || 0) > 0}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
