import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Package, ArrowUpCircle, AlertTriangle,
  RefreshCw, X, PlusCircle, Search,
  TrendingDown, Boxes, ClipboardList
} from 'lucide-react';
import { stockTransactionApi, productApi, StockTransaction, Product } from '@/lib/api';
import { useGlobalData } from '@/context/GlobalDataContext';
import { formatDate } from '@/lib/utils';

const TX_LABELS: Record<StockTransaction['transactionType'], string> = {
  OPENING_STOCK: 'Opening Stock',
  STOCK_IN: 'Stock In',
  SALE: 'Sale',
  DAMAGED: 'Damaged',
  ADJUSTMENT: 'Adjustment',
  CORRECTION: 'Correction',
};

const TX_COLORS: Record<StockTransaction['transactionType'], { bg: string; text: string }> = {
  OPENING_STOCK: { bg: 'bg-blue-50', text: 'text-blue-700' },
  STOCK_IN:      { bg: 'bg-green-50', text: 'text-green-700' },
  SALE:          { bg: 'bg-purple-50', text: 'text-purple-700' },
  DAMAGED:       { bg: 'bg-red-50', text: 'text-red-700' },
  ADJUSTMENT:    { bg: 'bg-amber-50', text: 'text-amber-700' },
  CORRECTION:    { bg: 'bg-gray-50', text: 'text-gray-700' },
};

const isPositive = (tx: StockTransaction) =>
  ['OPENING_STOCK', 'STOCK_IN'].includes(tx.transactionType);

const ALL_TYPES = Object.keys(TX_LABELS) as StockTransaction['transactionType'][];

// ── Adjust Stock Modal ──────────────────────────────────────────────────────────
interface AdjustModalProps {
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}

const AdjustStockModal: React.FC<AdjustModalProps> = ({ products, onClose, onSaved }) => {
  const [productId, setProductId] = useState('');
  const [txType, setTxType] = useState<StockTransaction['transactionType']>('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const qty = parseInt(quantity, 10) || 0;
  const positive = isPositive({ transactionType: txType } as StockTransaction);
  const newStock = Math.max(0, (selectedProduct?.stockQuantity ?? 0) + (positive ? qty : -qty));

  const handleSave = async () => {
    if (!productId) { toast.error('Please select a product'); return; }
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    setSaving(true);
    try {
      const prevStock = selectedProduct?.stockQuantity ?? 0;
      const resulting = Math.max(0, prevStock + (positive ? qty : -qty));
      await stockTransactionApi.add({
        productId,
        productName: selectedProduct?.name ?? '',
        transactionType: txType,
        quantity: qty,
        previousStock: prevStock,
        resultingStock: resulting,
        reason: reason || TX_LABELS[txType],
        referenceType: 'MANUAL',
        createdAt: new Date().toISOString(),
      });
      await productApi.update(productId, { stockQuantity: resulting });
      toast.success('Stock updated');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error('Failed to update stock: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Adjust Stock</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Product</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select product</option>
              {products.filter(p => p.active && p.inventoryTracking !== 'NOT_TRACKED').map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity ?? 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Transaction Type</label>
            <select value={txType} onChange={e => setTxType(e.target.value as StockTransaction['transactionType'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="STOCK_IN">Stock In</option>
              <option value="DAMAGED">Damaged</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Quantity</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Reason / Notes</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          {selectedProduct && qty > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1 border border-blue-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Stock</span>
                <span className="font-semibold">{selectedProduct.stockQuantity ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Change</span>
                <span className={`font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>{positive ? '+' : '-'}{qty}</span>
              </div>
              <div className="border-t border-blue-200 pt-1 flex justify-between">
                <span className="font-semibold text-gray-700">New Stock</span>
                <span className="font-bold text-blue-700">{newStock}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────────
const StockMovements = () => {
  const { products } = useGlobalData();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StockTransaction['transactionType'] | ''>('');
  const [filterProductId, setFilterProductId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await stockTransactionApi.getAll();
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setTransactions(sorted);
    } catch {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType && tx.transactionType !== filterType) return false;
      if (filterProductId && tx.productId !== filterProductId) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!tx.productName?.toLowerCase().includes(s) && !tx.reason?.toLowerCase().includes(s)) return false;
      }
      if (startDate && new Date(tx.createdAt || '') < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59);
        if (new Date(tx.createdAt || '') > end) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterProductId, searchTerm, startDate, endDate]);

  const stats = useMemo(() => ({
    total: filtered.length,
    stockIn: filtered.filter(t => ['OPENING_STOCK', 'STOCK_IN'].includes(t.transactionType)).reduce((s, t) => s + t.quantity, 0),
    stockOut: filtered.filter(t => ['SALE', 'DAMAGED'].includes(t.transactionType)).reduce((s, t) => s + t.quantity, 0),
    adjustments: filtered.filter(t => ['ADJUSTMENT', 'CORRECTION'].includes(t.transactionType)).length,
  }), [filtered]);

  const hasFilters = searchTerm || filterType || filterProductId || startDate || endDate;
  const clearFilters = () => { setSearchTerm(''); setFilterType(''); setFilterProductId(''); setStartDate(''); setEndDate(''); };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auditable inventory transaction log</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle size={15} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, color: 'text-gray-900', lcolor: 'text-gray-400' },
          { label: 'Stock In', value: `+${stats.stockIn}`, color: 'text-green-600', lcolor: 'text-green-400' },
          { label: 'Stock Out', value: `-${stats.stockOut}`, color: 'text-red-600', lcolor: 'text-red-400' },
          { label: 'Adjustments', value: stats.adjustments, color: 'text-amber-600', lcolor: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-xs font-semibold uppercase tracking-wider ${s.lcolor}`}>{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search product / reason…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Types</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{TX_LABELS[t]}</option>)}
          </select>
          <select value={filterProductId} onChange={e => setFilterProductId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Products</option>
            {(products || []).map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <div className="flex gap-2">
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors" title="Clear filters">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
            <Package size={40} className="opacity-40" />
            <p className="text-sm font-medium">No stock transactions found</p>
            {hasFilters && <button onClick={clearFilters} className="text-xs text-blue-500 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Date & Time', 'Product', 'Type', 'Qty', 'Before', 'After', 'Reason'].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${['Qty', 'Before', 'After'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tx, idx) => {
                  const meta = TX_COLORS[tx.transactionType];
                  const pos = isPositive(tx);
                  return (
                    <tr key={tx.id || idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                        {tx.createdAt ? formatDate(tx.createdAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800">{tx.productName}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                          {TX_LABELS[tx.transactionType]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-bold text-base ${pos ? 'text-green-600' : 'text-red-600'}`}>
                          {pos ? '+' : '-'}{tx.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500 font-medium">{tx.previousStock}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-800">{tx.resultingStock}</td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{tx.reason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-gray-50 border-t text-xs text-gray-400 font-medium">
              Showing {filtered.length} of {transactions.length} entries
            </div>
          </div>
        )}
      </div>

      {showAdjustModal && (
        <AdjustStockModal products={products as Product[]} onClose={() => setShowAdjustModal(false)} onSaved={load} />
      )}
    </div>
  );
};

export default StockMovements;
