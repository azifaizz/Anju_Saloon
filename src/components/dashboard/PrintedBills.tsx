import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { billingService, billingApi } from "@/lib/api";
import { useGlobalData } from "@/context/GlobalDataContext";
import { utils, writeFile } from "xlsx";
import { Printer, FileText, Search, FileSpreadsheet, Eye, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
// Removed useLocalStorage
import { APP_CONFIG } from '@/config';
import { BillRenderer } from "@/components/BillRenderer";
import { mapExeBillData } from "@/utils/exeBillAdapter";
import { useReactToPrint } from 'react-to-print';
import { numberToWords } from "@/utils/numberToWords";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "@/hooks/useConfirm";
import { Trash2, RotateCcw } from "lucide-react";

interface BillItem {
  productId?: string;
  barcode?: string;
  productName: string;
  quantity: number;
  discountRate: number;
  unitPrice: number;
  netAmount?: number;
  gstRate: number;
}

interface Bill {
  id?: string;
  invoiceId?: string;
  customerName?: string;
  customerPhone?: string | number;
  customerAddress?: string;
  customerGst?: string;
  items: BillItem[];
  finalAmount?: number;
  paymentMethod?: string;
  createdAt?: string;
}

const PrintedBills: React.FC = () => {
  const navigate = useNavigate();
  const { 
    bills: globalBills, 
    cancelledBills: globalCancelled, 
    refreshBills, 
    refreshCancelled,
    settings
  } = useGlobalData();
  const { confirm, ConfirmationDialog } = useConfirm();

  const [activeTab, setActiveTab] = useState<"BILL">("BILL");
  const [data, setData] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [systemTypeFilter, setSystemTypeFilter] = useState<"All" | "Retail">("All");

  const printRef = React.useRef<HTMLDivElement>(null);
  const [selectedPrintBill, setSelectedPrintBill] = useState<any>(null);

  const handlePrintReact = useReactToPrint({
    contentRef: printRef,
  });

  const handleCancelBill = (id: string) => {
    confirm("Are you sure you want to cancel this bill? This will restore stock, reverse commissions, and void the revenue.", async () => {
      try {
        setProcessingId(id);
        await billingApi.cancelBill(id);
        toast.success("Bill cancelled successfully!");
        await refreshBills();
      } catch (err: any) {
        toast.error(err.response?.data?.error || err.message || "Failed to cancel bill");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleRefundBill = (id: string) => {
    confirm("Are you sure you want to refund this bill? This will mark it as refunded, restore stock, and reverse commissions.", async () => {
      try {
        setProcessingId(id);
        await billingApi.refundBill(id);
        toast.success("Bill refunded successfully!");
        await refreshBills();
      } catch (err: any) {
        toast.error(err.response?.data?.error || err.message || "Failed to refund bill");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const shopName = settings?.shopName || APP_CONFIG.COMPANY_NAME;
  const billMessage = settings?.billMessage || "Thank You For Your Purchasing";
  const gstNumber = settings?.gstNumber || "";

  useEffect(() => {
    refreshBills();
  }, [activeTab]);

  const currentSourceData = React.useMemo(() => {
    return globalBills;
  }, [activeTab, globalBills, data]);

  const normalizedData = React.useMemo(() => {
    return currentSourceData.map((item: any) => {
      let finalAmt = Number(item.finalAmount || item.totalAmount || item.total || 0);
      if (finalAmt === 0 && item.items && Array.isArray(item.items)) {
        finalAmt = item.items.reduce((sum: number, line: any) => {
          const qty = Number(line.quantity || line.qty || 0);
          const price = Number(line.unitPrice || line.price || line.rate || 0);
          const discRate = Number(line.discountRate || line.discount || 0);
          const subtotal = qty * price;
          const discountAmount = subtotal * (discRate / 100);
          return sum + (subtotal - discountAmount);
        }, 0);
      }
      return { ...item, finalAmount: finalAmt };
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentSourceData]);

  const filteredData = normalizedData.filter((item) => {
    const status = ((item as any).status || "").toUpperCase();
    const pm = ((item as any).paymentMethod || "").toUpperCase();

    // Logic for tab-based filtering
    if (activeTab === "BILL") {
        if (status === "HOLD" || status === "CANCELLED" || status === "REFUNDED") return false;
        if (!status && (pm === "HOLD" || pm === "CANCELLED")) return false;
    }

    if (systemTypeFilter !== "All" && item.systemType !== systemTypeFilter) return false;

    const billDate = new Date(item.createdAt);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (billDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (billDate > end) return false;
    }

    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    const id = (item.invoiceId || item.id || "").toLowerCase();
    const name = (item.customerName || "").toLowerCase();
    const phone = (item.customerPhone || "").toString();

    return id.includes(lower) || name.includes(lower) || phone.includes(searchTerm);
  });

  const totalAmount = filteredData.reduce((sum, item) => sum + (item.finalAmount || 0), 0);

  const handleExportExcel = () => {
    if (!filteredData.length) {
      toast.error("No data to export.");
      return;
    }

    const excelData = filteredData.map((item, i) => ({
      "S.No": i + 1,
      "ID": item.invoiceId || item.id,
      "Customer Name": item.customerName || "Walk-in",
      "Contact": item.customerPhone || "N/A",
      "Date": new Date(item.createdAt).toLocaleDateString("en-GB"),
      "Items": item.items?.length || 0,
      "Total": item.finalAmount,
    }));

    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Bills");
    writeFile(wb, `Bills_History.xlsx`);
  };

  const handlePrintAction = (item: Bill) => {
    if (activeTab === "BILL") {
      handleReprintBill(item);
    } else {
      handlePrintEstimation(item);
    }
  };

  const handleReprintBill = (bill: Bill) => {
    let totalTaxableAmount = 0;
    let totalDiscountAmount = 0;
    let totalGstAmount = 0;

    const printItems = (bill.items || []).map(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discountRate = Number(item.discountRate) || 0;
      const gstRate = Number(item.gstRate) || 0;

      const subtotal = price * qty;
      const discountAmount = subtotal * (discountRate / 100);
      const taxable = subtotal - discountAmount;
      const gstAmount = taxable * (gstRate / 100);
      const finalAmount = taxable + gstAmount;

      totalTaxableAmount += taxable;
      totalDiscountAmount += discountAmount;
      totalGstAmount += gstAmount;

      return {
        productId: (item as any).productId || (item as any).barcode || (item as any).id,
        barcode: (item as any).barcode || (item as any).productId,
        name: item.productName,
        qty: qty,
        price: price,
        gstPercent: gstRate,
        GST: gstRate,
        discountRate: discountRate,
        Discount: discountRate,
        discountAmount: discountAmount,
        baseAmount: taxable,
        gstAmount: gstAmount,
        finalAmount: finalAmount,
        total: finalAmount
      };
    });

    const exeData = mapExeBillData({
      ...bill,
      items: printItems,
      totalAmount: bill.finalAmount || totalTaxableAmount + totalGstAmount,
      subtotal: totalTaxableAmount,
      totalDiscountAmount,
      totalGstAmount,
      cgstAmount: totalGstAmount / 2,
      sgstAmount: totalGstAmount / 2,
      billNo: bill.invoiceId || bill.id,
      settings: {
         gstPercentage: 12,
         customBillMessage: billMessage || "Thank You For Your Purchasing"
      }
    });

    setSelectedPrintBill(exeData);
    setTimeout(() => handlePrintReact(), 100);
  };

  const handlePrintEstimation = (est: Bill) => {
    let totalTaxableAmount = 0;
    let totalDiscountAmount = 0;
    let totalGstAmount = 0;

    const printItems = (est.items || []).map(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discountRate = Number(item.discountRate) || 0;
      const gstRate = Number(item.gstRate) || 0;

      const subtotal = price * qty;
      const discountAmount = subtotal * (discountRate / 100);
      const taxable = subtotal - discountAmount;
      const gstAmount = taxable * (gstRate / 100);
      const finalAmount = taxable + gstAmount;

      totalTaxableAmount += taxable;
      totalDiscountAmount += discountAmount;
      totalGstAmount += gstAmount;

      return {
        productId: (item as any).productId || (item as any).barcode || (item as any).id,
        barcode: (item as any).barcode || (item as any).productId,
        name: item.productName,
        qty: qty,
        price: price,
        gstPercent: gstRate,
        GST: gstRate,
        discountRate: discountRate,
        Discount: discountRate,
        discountAmount: discountAmount,
        baseAmount: taxable,
        gstAmount: gstAmount,
        finalAmount: finalAmount,
        total: finalAmount
      };
    });

    const exeData = mapExeBillData({
      ...est,
      items: printItems,
      totalAmount: est.finalAmount || totalTaxableAmount + totalGstAmount,
      subtotal: totalTaxableAmount,
      totalDiscountAmount,
      totalGstAmount,
      cgstAmount: totalGstAmount / 2,
      sgstAmount: totalGstAmount / 2,
      billNo: est.estimationId || est.id,
      billType: "BILL", // Use BILL type to show TAX INVOICE as requested
      settings: {
         gstPercentage: 12,
         customBillMessage: billMessage || "Thank You For Your Purchasing"
      }
    });

    setSelectedPrintBill(exeData);
    setTimeout(() => handlePrintReact(), 100);
  };

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="hidden">
        {selectedPrintBill && <BillRenderer ref={printRef} data={selectedPrintBill} />}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Bills History
        </h1>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search Invoice, Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-2 items-center text-sm font-medium text-gray-600">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="dd-mm-yyyy" />
          <span className="text-gray-400">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="dd-mm-yyyy" />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {['All', 'Retail'].map((type) => (
                <button
                    key={type}
                    onClick={() => setSystemTypeFilter(type as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${systemTypeFilter === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                    {type.toUpperCase()}
                </button>
            ))}
        </div>

        <button
          onClick={handleExportExcel}
          className="px-6 py-2 bg-[#28a745] text-white font-bold rounded-xl hover:bg-[#218838] flex items-center gap-2 transition-all shadow-sm"
        >
          <FileSpreadsheet size={18} /> Export Bills
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-blue-50 px-3 py-1.5 text-sm rounded-xl border border-blue-100 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">Count:</span>
            <span className="text-base font-black text-blue-700">{filteredData.length}</span>
          </div>
          <div className="bg-indigo-50 px-3 py-1.5 text-sm rounded-xl border border-indigo-100 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">Total:</span>
            <span className="text-base font-black text-indigo-700">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-tight border-b border-gray-100">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4 text-center">Items</th>
                <th className="p-4 text-right">Final Amount</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-blue-600 cursor-pointer">{item.invoiceId || item.id}</td>
                    <td className="p-4 font-bold text-gray-700 uppercase">{item.customerName || "Walk-in"}</td>
                    <td className="p-4 text-gray-600 font-medium">{item.customerPhone || "N/A"}</td>
                    <td className="p-4 text-gray-500 text-xs font-medium">
                       {new Date(item.createdAt).toLocaleString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                       })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold text-xs">{item.items?.length || 0}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">₹{item.finalAmount?.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-3">
                        {processingId === item.id ? (
                          <span className="text-gray-400 text-xs font-medium italic animate-pulse py-2">Processing...</span>
                        ) : (
                          <>
                            <button onClick={() => handlePrintAction(item)} title="Reprint" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"><Printer size={18} /></button>
                             {((item as any).status || '').toUpperCase() !== 'CANCELLED' && ((item as any).status || '').toUpperCase() !== 'REFUNDED' && (
                               <>
                                 <button onClick={() => handleRefundBill(item.id!)} title="Refund Bill" className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors shadow-sm"><RotateCcw size={18} /></button>
                                 <button onClick={() => handleCancelBill(item.id!)} title="Cancel Bill" className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm"><Trash2 size={18} /></button>
                               </>
                             )}
                             {(((item as any).status || '').toUpperCase() === 'CANCELLED' || ((item as any).status || '').toUpperCase() === 'REFUNDED') && (
                               <span className={`px-2 py-1 rounded-full text-xs font-bold ${((item as any).status || '').toUpperCase() === 'REFUNDED' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                 {((item as any).status || '').toUpperCase()}
                               </span>
                             )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-gray-400 font-medium italic">
                    No records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationDialog />
    </motion.div>
  );
};

export default PrintedBills;
