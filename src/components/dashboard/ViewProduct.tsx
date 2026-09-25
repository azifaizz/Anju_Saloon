import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGlobalData } from '@/context/GlobalDataContext';
import { customerApi, Product, Customer } from '@/lib/api';
import { Package, User, Calendar, IndianRupee, ArrowLeft, AlertCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const ViewProduct = () => {
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('customerId');
    const navigate = useNavigate();
    const { bills, customers, products: globalProducts } = useGlobalData();
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerPurchases, setCustomerPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const phone = searchParams.get('phone');
        if (customerId || phone) {
            fetchCustomerData(customerId, phone);
        } else {
            setError("Missing Customer Information");
            setLoading(false);
        }
    }, [customerId, searchParams, bills, customers]);

    const fetchCustomerData = async (cidParam: string | null, phoneParam: string | null) => {
        setLoading(true);
        try {
            // Robust check for string-encoded null/undefined from URL searchParams
            const cid = (cidParam && cidParam !== 'undefined' && cidParam !== 'null' && cidParam !== '') ? cidParam : null;
            const phone = (phoneParam && phoneParam !== 'undefined' && phoneParam !== 'null' && phoneParam !== '') ? phoneParam : null;

            let targetCustomer: Customer | null = null;
            
            // 1. Try to find in global context first (efficient)
            if (cid) {
                targetCustomer = customers.find(c => c.id === cid) || null;
            }
            
            if (!targetCustomer && phone) {
                targetCustomer = customers.find(c => c.phone?.toString() === phone.toString()) || null;
            }

            // 2. If not in context, try API (only if we have a valid ID)
            if (!targetCustomer && cid) {
                try {
                    const res = await customerApi.getById(cid);
                    if (res.data) targetCustomer = res.data;
                } catch (apiErr) {
                    console.warn("Customer API fetch failed, falling back to bills data", apiErr);
                }
            }

            // 3. Fallback: Create a mock customer from bills if still not found
            if (!targetCustomer && (cid || phone)) {
                const matchingBill = bills.find(b => 
                    (cid && b.customerId === cid) || 
                    (phone && b.customerPhone?.toString() === phone.toString())
                );
                
                if (matchingBill) {
                    targetCustomer = {
                        id: cid || 'new-customer',
                        name: matchingBill.customerName || 'Customer',
                        phone: phone || matchingBill.customerPhone?.toString() || '',
                    };
                }
            }

            if (targetCustomer) {
                setCustomer(targetCustomer);
                
                // 4. Filter bills strictly for this customer only
                const customerBills = bills.filter(b => 
                    (cid && b.customerId === cid) || 
                    (targetCustomer?.phone && b.customerPhone?.toString() === targetCustomer.phone.toString())
                );
                
                const items = customerBills.flatMap(bill => 
                    (bill.items || []).map(item => ({
                        ...item,
                        billId: bill.id,
                        billDate: bill.createdAt,
                        invoiceNumber: bill.invoiceNumber || bill.id,
                        paymentMethod: bill.paymentMethod
                    }))
                ).sort((a, b) => new Date(b.billDate || 0).getTime() - new Date(a.billDate || 0).getTime());
                
                setCustomerPurchases(items);
                setError(null);
            } else {
                setError("No identification found for this customer lookup");
            }
        } catch (err) {
            console.error("Critical error in ViewProduct:", err);
            setError("Failed to load customer information");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-bold">Syncing Purchase Records...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center h-[80vh] flex flex-col items-center justify-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{error}</h2>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header with Customer Name (Optional requirement) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <span className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
                                <ShoppingBag size={28} />
                            </span>
                            Purchased Products
                        </h1>
                        <p className="text-gray-500 font-medium ml-14 -mt-1 uppercase tracking-wider text-xs">
                            Personalized History for <span className="text-gray-900 font-black">{customer?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex bg-white p-3 rounded-2xl shadow-sm border border-gray-100 items-center gap-4 px-6">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Customer ID</p>
                        <p className="font-bold text-gray-800 leading-none">{customerId}</p>
                    </div>
                </div>
            </div>

            {/* Strict data isolation check: already handled by searchParams and bills filter */}

            {customerPurchases.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed rounded-[3rem] p-20 text-center">
                    <Package className="mx-auto text-gray-200 mb-6" size={80} />
                    <h3 className="text-2xl font-black text-gray-400">NO PURCHASES FOUND</h3>
                    <p className="text-gray-500 mt-2 font-medium">This customer hasn't purchased any products yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customerPurchases.map((item, idx) => (
                        <div 
                            key={`${item.billId}-${idx}`} 
                            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <Package size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill No</p>
                                        <p className="font-bold text-gray-800">#{item.invoiceNumber}</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                    {item.productName}
                                </h3>
                                
                                <div className="space-y-4 pt-4 mt-4 border-t border-gray-50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-bold flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" /> Date
                                        </span>
                                        <span className="font-black text-gray-900">
                                            {new Date(item.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-bold flex items-center gap-2">
                                            <IndianRupee size={16} className="text-gray-400" /> Amount
                                        </span>
                                        <span className="font-black text-emerald-600 text-lg">
                                            ₹{(item.netAmount || (item.unitPrice * (item.quantity || 1))).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Quantity/Rate</span>
                                            <span className="font-bold text-gray-800 leading-none">
                                                {item.quantity || 1} x ₹{item.unitPrice?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Status</span>
                                            <span className="font-bold text-emerald-500 leading-none block">PAID</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewProduct;
