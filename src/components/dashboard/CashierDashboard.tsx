import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, AlertTriangle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { billingApi, productApi, appointmentApi, Bill, Product, Appointment } from '@/lib/api';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CashierDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, productsRes, apptsRes] = await Promise.all([
          billingApi.getAll(),
          productApi.getAll(),
          appointmentApi.getAll(),
        ]);
        if (Array.isArray(billsRes.data)) setBills(billsRes.data);
        if (Array.isArray(productsRes.data)) setProducts(productsRes.data);
        if (Array.isArray(apptsRes.data)) setAppointments(apptsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { todayBills, todayRevenue, lowStockCount, todayAppointmentsCount, recentBills } = useMemo(() => {
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const todays = bills.filter(bill => {
      if (bill.status === 'CANCELLED' || bill.status === 'HOLD') return false;
      const billDate = new Date(bill.createdAt || new Date());
      return billDate >= start && billDate <= end;
    });

    const revenue = todays.reduce((sum, bill) => sum + (bill.finalAmount || bill.amountPaid || 0), 0);
    const lowStock = products.filter(p => (p.stockQuantity || 0) <= 5).length;
    
    const sortedBills = [...bills]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    const todayStr = format(now, 'yyyy-MM-dd');
    const todayAppts = appointments.filter(a => a.date === todayStr).length;

    return {
      todayBills: todays.length,
      todayRevenue: revenue,
      lowStockCount: lowStock,
      todayAppointmentsCount: todayAppts,
      recentBills: sortedBills
    };
  }, [bills, products, appointments]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cashier Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of today's activities</p>
        </div>
        <button 
          onClick={() => navigate('/cashier/billing')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
        >
          <ShoppingCart size={18} /> New Bill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800">₹{todayRevenue.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Bills</p>
            <h3 className="text-2xl font-bold text-slate-800">{todayBills}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-slate-800">{lowStockCount}</h3>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Appointments</p>
            <h3 className="text-2xl font-bold text-slate-800">{todayAppointmentsCount}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Recent Transactions
          </h3>
          <button 
            onClick={() => navigate('/cashier/printed-bills')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white">
              <tr className="text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-600">
                    {bill.createdAt ? format(new Date(bill.createdAt), 'dd MMM, hh:mm a') : 'N/A'}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-800">{bill.customerName}</p>
                    <p className="text-xs text-slate-500">{bill.customerPhone}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">
                    {bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-800">
                    ₹{(bill.finalAmount || bill.amountPaid || 0).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      bill.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      bill.status === 'HOLD' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {bill.status || 'PAID'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBills.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
