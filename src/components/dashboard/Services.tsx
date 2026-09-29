import React, { useState } from 'react';
import { useGlobalData } from '@/context/GlobalDataContext';
import { salonServiceApi, SalonService, Staff } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, Scissors, X } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuth } from '@/context/AuthContext';

export default function Services() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { salonServices, staff, refreshSalonServices } = useGlobalData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const { confirm, ConfirmationDialog } = useConfirm();

  const visibleServices = isAdmin ? salonServices : salonServices.filter(s => s.active !== false);

  const filteredServices = visibleServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce((acc, service) => {
    const cat = service.categoryId || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, SalonService[]>);

  const handleEdit = (service: SalonService) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    confirm("Are you sure you want to delete this service?", async () => {
      try {
        await salonServiceApi.delete(id);
        toast.success("Service deleted");
        refreshSalonServices();
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete service");
      }
    });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-lg">
            <Scissors className="text-slate-900" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Salon Services</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your service catalog and pricing</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={18} /> Add Service
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedServices).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center text-slate-400">
            No services found
          </div>
        ) : (
          Object.entries(groupedServices).map(([category, services]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">{category}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-semibold border-b border-slate-100">Name</th>
                      <th className="p-4 font-semibold border-b border-slate-100">Price</th>
                      <th className="p-4 font-semibold border-b border-slate-100">Duration (min)</th>
                      {isAdmin && <th className="p-4 font-semibold border-b border-slate-100">Commission</th>}
                      {isAdmin && <th className="p-4 font-semibold border-b border-slate-100">Staff Eligibility</th>}
                      {isAdmin && <th className="p-4 font-semibold border-b border-slate-100">Status</th>}
                      {isAdmin && <th className="p-4 font-semibold border-b border-slate-100 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map(service => (
                      <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{service.name}</div>
                          <div className="text-sm text-slate-500">{service.description}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">₹{service.price}</td>
                        <td className="p-4 text-slate-600">{service.duration || '-'}</td>
                        {isAdmin && (
                          <td className="p-4 text-slate-600">
                            {service.commissionType === 'PERCENTAGE' ? `${service.commissionValue || 0}%` : `₹${service.commissionValue || 0}`}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="p-4 text-slate-600">
                            {(service.eligibleStaffIds || []).length > 0 ? `${service.eligibleStaffIds?.length} Staff` : 'All Staff'}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                              service.active !== false ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {service.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        )}
                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex justify-end items-center gap-1">
                              <button 
                                onClick={() => handleEdit(service)}
                                title="Edit Service"
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(service.id)}
                                title="Delete Service"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ServiceModal 
          service={editingService} 
          staffList={staff}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            refreshSalonServices();
          }} 
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}

function ServiceModal({ service, staffList, onClose, onSuccess }: { service: SalonService | null, staffList: Staff[], onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState<Partial<SalonService>>(
    service || { name: '', categoryId: '', description: '', price: 0, duration: 30, active: true, commissionType: 'PERCENTAGE', commissionValue: 0, eligibleStaffIds: [] }
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
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{service ? 'Edit Service' : 'Add New Service'}</h2>
            <p className="text-xs text-slate-500 mt-1">{service ? 'Update service details below' : 'Fill in the details for the new service'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-md transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Service Name</label>
              <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="e.g. Premium Haircut" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <input type="text" value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="e.g. Hair Care" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Duration (min)</label>
                <input type="number" value={formData.duration || 30} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
              <input required type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none" placeholder="Optional details..." />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Commission Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={formData.commissionType || 'PERCENTAGE'} 
                    onChange={e => setFormData({...formData, commissionType: e.target.value as 'PERCENTAGE' | 'FIXED'})} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Value</label>
                  <input 
                    type="number" 
                    value={formData.commissionValue || 0} 
                    onChange={e => setFormData({...formData, commissionValue: Number(e.target.value)})} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Eligible Staff</label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white p-3 space-y-2">
                {staffList.map(s => (
                  <label key={s.id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                    <input 
                      type="checkbox" 
                      checked={(formData.eligibleStaffIds || []).includes(s.id)}
                      onChange={(e) => {
                        const current = formData.eligibleStaffIds || [];
                        if (e.target.checked) {
                          setFormData({...formData, eligibleStaffIds: [...current, s.id]});
                        } else {
                          setFormData({...formData, eligibleStaffIds: current.filter(id => id !== s.id)});
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="flex flex-col">
                      <span className="font-medium text-slate-900">{s.name}</span>
                      <span className="text-xs text-slate-500">{s.role}</span>
                    </span>
                  </label>
                ))}
                {staffList.length === 0 && <div className="text-sm text-slate-400 py-2 text-center">No staff found</div>}
              </div>
              <p className="text-xs text-slate-500 mt-2">Leave all unchecked to allow any staff member to perform this service.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="active" 
                checked={formData.active !== false} 
                onChange={e => setFormData({...formData, active: e.target.checked})} 
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="active" className="text-sm font-medium text-slate-900 cursor-pointer">Active Service</label>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : (service ? 'Save Changes' : 'Create Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
