import React, { useState } from 'react';
import { useGlobalData } from '@/context/GlobalDataContext';
import { salonServiceApi, SalonService } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, Scissors, X } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';

export default function Services() {
  const { salonServices, refreshSalonServices } = useGlobalData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const confirm = useConfirm();

  const filteredServices = salonServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (service: SalonService) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm("Are you sure you want to deactivate this service?");
    if (isConfirmed) {
      try {
        await salonServiceApi.update(id, { active: false });
        toast.success("Service deactivated");
        refreshSalonServices();
      } catch (err) {
        toast.error("Failed to deactivate service");
      }
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scissors className="text-blue-500" />
            Salon Services
          </h1>
          <p className="text-sm text-slate-500">Manage your salon services</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
          >
            <Plus size={20} /> Add Service
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-semibold border-b border-slate-200">Name</th>
                <th className="p-4 font-semibold border-b border-slate-200">Category</th>
                <th className="p-4 font-semibold border-b border-slate-200">Price</th>
                <th className="p-4 font-semibold border-b border-slate-200">Duration (min)</th>
                <th className="p-4 font-semibold border-b border-slate-200">Status</th>
                <th className="p-4 font-semibold border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{service.name}</div>
                    <div className="text-sm text-slate-500">{service.description}</div>
                  </td>
                  <td className="p-4 text-slate-600">{service.categoryId || 'N/A'}</td>
                  <td className="p-4 font-medium text-slate-800">₹{service.price}</td>
                  <td className="p-4 text-slate-600">{service.duration || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(service)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        disabled={!service.active}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No services found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ServiceModal 
          service={editingService} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            refreshSalonServices();
          }} 
        />
      )}
    </div>
  );
}

function ServiceModal({ service, onClose, onSuccess }: { service: SalonService | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState<Partial<SalonService>>(
    service || { name: '', categoryId: '', description: '', price: 0, duration: 30, active: true }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (service?.id) {
        await salonServiceApi.update(service.id, formData);
        toast.success("Service updated");
      } else {
        await salonServiceApi.add(formData);
        toast.success("Service added");
      }
      onSuccess();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">{service ? 'Edit Service' : 'Add New Service'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
            <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <input type="text" value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input required type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <input type="number" value={formData.duration || 30} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={formData.active !== false} onChange={e => setFormData({...formData, active: e.target.checked})} />
            <label htmlFor="active">Active</label>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
