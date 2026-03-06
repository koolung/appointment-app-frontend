'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface Client {
  id: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  createdAt: string;
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search term (name, email, phone)
  const filteredClients = clients.filter((client) => {
    if (!client.user) return false;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.user.firstName} ${client.user.lastName}`.toLowerCase();
    const email = client.user.email.toLowerCase();
    const phone = (client.user.phone || '').toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  const handleOpenModal = (client?: Client) => {
    if (client && client.user) {
      setEditingClientId(client.id);
      setFormData({
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        email: client.user.email,
        phone: client.user.phone,
      });
    } else {
      setEditingClientId(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.firstName.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      setFormError('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }

    try {
      if (editingClientId) {
        // Update existing client
        await api.put(`/clients/${editingClientId}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        });
        setSuccessMessage('Client updated successfully!');
      } else {
        // Create new client
        await api.post('/clients', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        });
        setSuccessMessage('Client created successfully!');
      }

      handleCloseModal();
      await fetchClients();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save client';
      setFormError(errorMsg);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter((c) => c.id !== id));
      setSuccessMessage('Client deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete client';
      alert(errorMsg);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
            <p className="text-slate-600 mt-1">Manage your salon clients</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Client
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <p>No clients found</p>
              <button
                onClick={() => handleOpenModal()}
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Create your first client
              </button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <p>No clients match your search</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Joined</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {client.user?.firstName} {client.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.user?.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.user?.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.user?.createdAt
                        ? new Date(client.user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="text-blue-600 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            client.id,
                            `${client.user?.firstName} ${client.user?.lastName}`
                          )
                        }
                        className="text-red-600 hover:underline"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingClientId ? 'Edit Client' : 'Add New Client'}
            </h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingClientId ? 'Update Client' : 'Create Client'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
