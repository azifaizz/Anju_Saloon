import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Layers, X, CreditCard, Trash2, PlusCircle, Printer, Save } from 'lucide-react';
import { CreditTransaction, Vendor, vendorApi } from '@/lib/api';
import SupplierCreditPanel from './SupplierCreditPanel';

import { generateSixDigitId } from '@/lib/utils';
import { formatBarcodeMeta } from '@/lib/barcodeUtils';
import { printProductBarcodes } from '@/lib/printBarcodeUtils';

// Data Structures
interface ProductRow {
    id: string;
    name: string;
    category: string;
    series: string;
    purchaseRate: number;
    baseBuyingPrice: number;
    purchaseGst: number;
    price: number;
    wholesalePrice: number;
    stockQuantity: number;
    barcode: string;
    purchaseDisc: number;
    discount: number;
    imageFile?: File | null;
}

interface MultiProductFormModalProps {
    vendors: Vendor[];
    weavers: any[];
    categories: string[];
    onSave: (products: any[], creditData?: Partial<CreditTransaction>) => void;
    onClose: () => void;
    defaultGst: number;
    isSaving?: boolean;
    shopName: string;
    initialProductType?: 'Retail' | 'Wholesale';
}

const MultiProductFormModal = ({ vendors, weavers, categories, onSave, onClose, defaultGst, shopName, isSaving, initialProductType = 'Retail' }: MultiProductFormModalProps) => {
    const [productType, setProductType] = useState<'Retail' | 'Wholesale'>(initialProductType);
    const [selectedVendorId, setSelectedVendorId] = useState<string>(
        initialProductType === 'Retail'
            ? (vendors[0]?.id || '')
            : (weavers[0]?.id || '')
    );
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [billNumber, setBillNumber] = useState('');

    // Cart State
    const [addedProducts, setAddedProducts] = useState<ProductRow[]>([]);

    // State to track if products have been saved
    const [isProductsSaved, setIsProductsSaved] = useState(false);

    // Selection state for printing
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // State to track if credit transaction has been saved in the panel
    const [isCreditSaved, setIsCreditSaved] = useState(false);
    const [creditTransactionId, setCreditTransactionId] = useState<string | undefined>(undefined);

    const generatePrefixedId = () => {
        const prefix = productType === 'Retail' ? 'MSRE' : 'MSWS';
        return `${prefix}${generateSixDigitId()}`;
    };

    // Input Row State
    const getDefaultInput = (): ProductRow => ({
        id: generatePrefixedId(),
        name: '',
        category: categories[0] || '',
        series: '',
        purchaseRate: 0,
        baseBuyingPrice: 0,
        purchaseGst: 0,
        price: 0,
        wholesalePrice: 0,
        stockQuantity: 1,
        barcode: '',
        purchaseDisc: 0,
        discount: 0,
        imageFile: null,
    });
    const [currentInput, setCurrentInput] = useState<ProductRow>(getDefaultInput());

    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    const clearCurrentInputImage = () => {
        setCurrentInput(prev => ({ ...prev, imageFile: null }));
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newRows: ProductRow[] = [];
        Array.from(files).forEach((file) => {
            if (!supportedImageTypes.includes(file.type)) {
                toast.error(`Unsupported file type: ${file.name}`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`Image ${file.name} must be smaller than 5MB.`);
                return;
            }

            const newId = generatePrefixedId();
            newRows.push({
                ...getDefaultInput(),
                id: newId,
                barcode: newId,
                imageFile: file,
            });
        });

        if (newRows.length > 0) {
            clearCurrentInputImage();
            setAddedProducts(prev => {
                if (isCreditSaved) {
                    setIsCreditSaved(false);
                    setCreditTransactionId(undefined);
                }
                return [...newRows, ...prev];
            });
            setSelectedProductIds(prev => {
                const next = new Set(prev);
                newRows.forEach(row => next.add(row.id));
                return next;
            });
        }
    };

    const handleImageSelection = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        if (files.length === 1 && (currentInput.name?.trim() || currentInput.price != null || currentInput.purchaseRate != null || currentInput.stockQuantity != null || currentInput.series || currentInput.category)) {
            const file = files[0];
            if (!supportedImageTypes.includes(file.type)) {
                toast.error(`Unsupported file type: ${file.name}`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`Image ${file.name} must be smaller than 5MB.`);
                return;
            }
            handleInputChange('imageFile', file);
            return;
        }

        handleFiles(files);
    };

    // Searchable Supplier State
    const [supplierSearchQuery, setSupplierSearchQuery] = useState(() => {
        if (initialProductType === 'Retail') {
            return vendors.find(v => v.id === selectedVendorId)?.name || (vendors[0]?.name || '');
        } else {
            return weavers.find(w => w.id === selectedVendorId)?.name || (weavers[0]?.name || '');
        }
    });
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(-1);
    const supplierInputRef = useRef<HTMLInputElement>(null);

    // Searchable Category State
    const [categorySearchQuery, setCategorySearchQuery] = useState(currentInput.category);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState(-1);
    const categoryInputRef = useRef<HTMLInputElement>(null);

    const [isCreditPanelOpen, setIsCreditPanelOpen] = useState(true);
    const [addToCredit, setAddToCredit] = useState(true);
    const [paymentMode, setPaymentMode] = useState<'CREDIT' | 'CASH' | 'ONLINE' | 'CHEQUE'>('CREDIT');
    const [localSaving, setLocalSaving] = useState(false);
    const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
        };
    }, []);

    // Captured state from SupplierCreditPanel
    const [creditFormDetails, setCreditFormDetails] = useState<Partial<CreditTransaction>>({});

    // Focus Ref
    const imageInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const seriesInputRef = useRef<HTMLInputElement>(null);
    const purchaseInputRef = useRef<HTMLInputElement>(null);
    const purchaseGstInputRef = useRef<HTMLInputElement>(null);
    const purchaseDiscInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const wholesalePriceInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);
    const billNumberInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (field: keyof ProductRow, value: string | number | File | null) => {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : (typeof value === 'number' ? value : 0);

        setCurrentInput(prev => {
            if (field === 'purchaseRate') {
                // When Buying Price is edited: Update both, reset GST
                return {
                    ...prev,
                    purchaseRate: numValue,
                    baseBuyingPrice: numValue,
                    purchaseGst: 0
                };
            }
            if (field === 'purchaseGst') {
                // When GST is edited: Update GST and final purchaseRate based on baseBuyingPrice
                const finalRate = prev.baseBuyingPrice + (prev.baseBuyingPrice * numValue / 100);
                return {
                    ...prev,
                    purchaseGst: numValue,
                    purchaseRate: Number((finalRate || 0).toFixed(2))
                };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSelectVendor = (vendor: Vendor) => {
        setSelectedVendorId(vendor.id);
        setSupplierSearchQuery(vendor.name);
        setIsSupplierDropdownOpen(false);
        setHighlightedSupplierIndex(0);

        // Auto-open credit ledger for weavers as requested
        if (productType === 'Wholesale') {
            setIsCreditPanelOpen(true);
        }

        billNumberInputRef.current?.focus();
    };

    const handleSelectCategory = (category: string) => {
        setCategorySearchQuery(category);
        handleInputChange('category', category);
        setIsCategoryDropdownOpen(false);
        setHighlightedCategoryIndex(0);
        purchaseInputRef.current?.focus();
    };

    const handleAddProduct = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!currentInput.name?.trim() && !currentInput.imageFile) {
            toast.error("Please enter a product name or upload an image");
            return;
        }

        const newId = currentInput.barcode || generatePrefixedId();
        const newProduct = {
            ...currentInput,
            id: newId,
            barcode: currentInput.barcode || newId,
        };

        // Add to TOP of list
        setAddedProducts(prev => {
            // Reset credit saved status if products change, as amount mismatches
            if (isCreditSaved) {
                setIsCreditSaved(false);
                setCreditTransactionId(undefined);
            }
            return [newProduct, ...prev]
        });

        // Auto-select the newly added product
        setSelectedProductIds(prev => new Set(prev).add(newProduct.id));

        const defaultInput = getDefaultInput();
        setCurrentInput(defaultInput);
        setCategorySearchQuery(defaultInput.category);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }

        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const handleRemoveProduct = (index: number) => {
        setAddedProducts(prev => {
            const productToRemove = prev[index];
            if (productToRemove) {
                setSelectedProductIds(oldSet => {
                    const newSet = new Set(oldSet);
                    newSet.delete(productToRemove.id);
                    return newSet;
                });
            }

            if (isCreditSaved) {
                setIsCreditSaved(false);
                setCreditTransactionId(undefined);
            }
            return prev.filter((_, i) => i !== index)
        });
    };

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedProductIds.size === addedProducts.length && addedProducts.length > 0) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(addedProducts.map(p => p.id)));
        }
    };

    const currentInputPurchase = (currentInput.name && currentInput.purchaseRate && currentInput.stockQuantity)
        ? (currentInput.purchaseRate * currentInput.stockQuantity)
        : 0;
    const totalPurchaseValue = addedProducts.reduce((acc, row) => acc + (row.purchaseRate * row.stockQuantity), 0) + currentInputPurchase;

    const currentInputSelling = (currentInput.name && currentInput.price && currentInput.stockQuantity)
        ? (currentInput.price * currentInput.stockQuantity)
        : 0;
    const totalSellingValue = addedProducts.reduce((acc, row) => acc + (row.price * row.stockQuantity), 0) + currentInputSelling;

    const hasCurrentInputContent = Boolean(
        currentInput.name?.trim() ||
        currentInput.imageFile ||
        currentInput.barcode?.trim()
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || localSaving) return;

        const selectedEntity = (productType === 'Retail' ? vendors : weavers).find(v => v.id === selectedVendorId);
        if (!selectedEntity) {
            toast.error(`Please select a valid ${productType === 'Retail' ? 'supplier' : 'weaver'}.`);
            return;
        }

        // Include current input if entered but not explicitly added
        let productsToProcess = [...addedProducts];
        if (hasCurrentInputContent) {
            const newId = currentInput.barcode || currentInput.id || generatePrefixedId();
            const newProduct = {
                ...currentInput,
                id: newId,
                barcode: currentInput.barcode || newId,
            };
            // Add to top of list for processing
            productsToProcess = [newProduct, ...productsToProcess];
        }

        if (productsToProcess.length === 0) {
            toast.error("No products added to save.");
            return;
        }



        setLocalSaving(true);
        try {
            let creditPayload: Partial<CreditTransaction> | undefined = undefined;

            if (addToCredit) {
                // Re-calculate totals based on productsToProcess
                const currentPurchaseValue = productsToProcess.reduce((acc, row) => acc + (row.purchaseRate * row.stockQuantity), 0);
                const txAmount = currentPurchaseValue;

                let txPaidAmount = 0;
                let finalPaymentMode = paymentMode;

                if (isCreditPanelOpen) {
                    txPaidAmount = creditFormDetails.paidAmount || 0;
                    if (creditFormDetails.paymentMode) {
                        finalPaymentMode = creditFormDetails.paymentMode as any;
                    }
                } else {
                    const isCredit = paymentMode === 'CREDIT';
                    txPaidAmount = isCredit ? 0 : txAmount;
                }

                const txBalance = txAmount - txPaidAmount;

                creditPayload = {
                    ...(productType === 'Wholesale' ? { weaverId: selectedEntity.id } : { vendorId: selectedEntity.id }),
                    invoice: billNumber,
                    amount: txAmount,
                    paidAmount: txPaidAmount,
                    balance: txBalance,
                    paymentMode: finalPaymentMode,
                    status: txBalance > 0 ? 'PENDING' : 'PAID',
                    description: creditFormDetails.description?.trim()
                        ? creditFormDetails.description.trim()
                        : `Purchase of ${productsToProcess.length} items`,
                    date: billDate,
                    createdAt: new Date().toISOString(),
                    products: productsToProcess.map(p => ({
                        ...p,
                        vendorId: selectedEntity.id,
                        vendorName: selectedEntity.name,
                        price: Number(p.price) || 0,
                        sellingPrice: Number(p.price) || 0,
                        wholesaleSellingPrice: Number(p.wholesalePrice || p.price) || 0,
                        wholesaleStockQuantity: Number(p.stockQuantity) || 0,
                        purchaseGst: Number(p.purchaseGst) || 0,
                        purchaseDisc: Number(p.purchaseDisc) || 0,
                    })) as any,
                };
            }

            const productsPayload = productsToProcess.map((row) => {
                const basePayload = {
                    ...row,
                    purchaseGst: Number(row.purchaseGst) || 0,
                    price: Number(row.price) || 0,
                    sellingPrice: Number(row.price) || 0,
                    wholesaleSellingPrice: Number(row.wholesalePrice || row.price) || 0,
                    wholesaleStockQuantity: Number(row.stockQuantity) || 0,
                    purchaseDisc: Number(row.purchaseDisc) || 0,
                    discount: Number(row.discount) || 0,
                    mrp: 0,
                    createdAt: billDate,
                    updatedAt: billDate,
                    billNo: billNumber,
                    systemType: productType
                };

                if (productType === 'Wholesale') {
                    return {
                        ...basePayload,
                        weaverId: selectedEntity.id,
                        weaverName: selectedEntity.name
                    };
                } else {
                    return {
                        ...basePayload,
                        vendorId: selectedEntity.id,
                        vendorName: selectedEntity.name
                    };
                }
            });

            onSave(productsPayload, creditPayload);
            setIsProductsSaved(false);
            setAddedProducts([]);
            setCurrentInput(getDefaultInput());
            setBillNumber('');
            toast.success("Saved! Ready for next batch.", { duration: 2500 });
        } catch (error) {
            console.error("Error in handleSubmit", error);
            setLocalSaving(false);
        } finally {
            setTimeout(() => setLocalSaving(false), 2000);
        }
    };

    // Derived values 
    const productsToSave = addedProducts;

    // Updated selection logic to handle both suppliers and weavers
    const selectedVendor = productType === 'Retail'
        ? vendors.find(v => v.id === selectedVendorId)
        : weavers.find(w => w.id === selectedVendorId);


    const handleCreditSuccess = (txId?: string) => {
        setIsCreditSaved(true);
        if (txId) setCreditTransactionId(txId);
    };

    const handlePrintBarcodes = async () => {
        let potentialProducts = [...addedProducts];
        if (currentInput.name.trim() && (currentInput.barcode || currentInput.id)) {
            const tempInput = {
                ...currentInput,
                id: currentInput.barcode || currentInput.id || generateSixDigitId(),
                barcode: currentInput.barcode || currentInput.id || generateSixDigitId()
            };
            potentialProducts = [tempInput, ...potentialProducts];
        }

        const productsToPrint = potentialProducts.filter(p => !isProductsSaved ? true : selectedProductIds.has(p.id));

        if (potentialProducts.length === 0) {
            toast.error("No products to print.");
            return;
        }

        if (productsToPrint.length === 0) {
            toast.error("Please select at least one product to print barcodes.");
            return;
        }

        const formattedProducts = productsToPrint.map(row => {
            // Find nickname for the selected vendor
            const selectedEntity = productType === 'Retail' 
                ? vendors.find(v => v.id === selectedVendorId)
                : weavers.find(w => w.id === selectedVendorId);
            
            const nickname = selectedEntity?.nickname || '';
            const series = (row as any).series || '';
            
            const metadata = formatBarcodeMeta({
                billNo: billNumber,
                vendorNickname: nickname,
                series: series,
                weaverNickname: productType === 'Wholesale' ? nickname : undefined
            });

            return {
                id: row.id,
                barcode: row.barcode,
                name: row.name,
                price: row.price,
                quantity: row.stockQuantity || 1,
                metadata: metadata
            };
        });

        printProductBarcodes(formattedProducts);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-h-[95vh] flex flex-col transition-all duration-300 ${isCreditPanelOpen ? 'max-w-[95vw]' : 'max-w-6xl'}`}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="text-blue-600" />
                        Add Multiple Products
                    </h2>
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 ml-4">
                        <button
                            type="button"
                            onClick={() => {
                                setProductType('Retail');
                                setCurrentInput(prev => ({ ...prev, id: `MSRE${generateSixDigitId()}` }));
                                const defId = vendors[0]?.id || '';
                                setSelectedVendorId(defId);
                                setSupplierSearchQuery(vendors[0]?.name || '');
                            }}
                            className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all ${productType === 'Retail' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            SUPPLIER
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setProductType('Wholesale');
                                setCurrentInput(prev => ({ ...prev, id: `MSWS${generateSixDigitId()}` }));
                                const defId = weavers[0]?.id || '';
                                setSelectedVendorId(defId);
                                setSupplierSearchQuery(weavers[0]?.name || '');
                                setIsCreditPanelOpen(true);
                            }}
                            className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all ${productType === 'Wholesale' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            WEAVER
                        </button>
                    </div>
                    <div className="flex-grow"></div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex flex-row gap-6 flex-grow overflow-hidden">
                    {/* LEFT SIDE: PRODUCT FORM */}
                    <div className={`flex flex-col flex-grow overflow-hidden transition-all duration-300 ${isCreditPanelOpen ? 'w-2/3' : 'w-full'}`}>
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Supplier & Header Info */}
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
                                <div className="flex flex-col w-1/4 min-w-[200px] relative">
                                    <label className="text-xs font-semibold text-gray-600 mb-1">Select {productType === 'Retail' ? 'Supplier' : 'Weaver'}</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <input
                                                ref={supplierInputRef}
                                                type="text"
                                                value={supplierSearchQuery}
                                                onChange={(e) => {
                                                    setSupplierSearchQuery(e.target.value);
                                                    setIsSupplierDropdownOpen(true);
                                                    setHighlightedSupplierIndex(0);
                                                }}
                                                onFocus={() => {
                                                    setIsSupplierDropdownOpen(true);
                                                    setHighlightedSupplierIndex(0);
                                                }}
                                                onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 200)}
                                                onKeyDown={(e) => {
                                                    const list = productType === 'Retail' ? vendors : weavers;
                                                    const filtered = list.filter(v => v.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()));
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setHighlightedSupplierIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setHighlightedSupplierIndex(prev => (prev > 0 ? prev - 1 : prev));
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (filtered.length > 0 && highlightedSupplierIndex >= 0 && highlightedSupplierIndex < filtered.length) {
                                                            handleSelectVendor(filtered[highlightedSupplierIndex]);
                                                        } else if (filtered.length > 0) {
                                                            handleSelectVendor(filtered[0]);
                                                        }
                                                    } else if (e.key === 'Escape') {
                                                        setIsSupplierDropdownOpen(false);
                                                    }
                                                }}
                                                placeholder="Search Supplier..."
                                                className="form-input bg-white w-full py-1.5 text-sm"
                                                required
                                            />
                                            {(productType === 'Retail' ? vendors : weavers).filter(v => v.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())).map((v, idx) => (
                                                <div
                                                    key={v.id}
                                                    onMouseEnter={() => setHighlightedSupplierIndex(idx)}
                                                    onClick={() => handleSelectVendor(v as any)}
                                                    className={`px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 ${highlightedSupplierIndex === idx ? 'bg-blue-100' : ''}`}
                                                >
                                                    <div className="font-medium text-gray-800">{v.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {!isCreditPanelOpen && (
                                            <button
                                                type="button"
                                                onClick={() => setIsCreditPanelOpen(true)}
                                                className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                                                title="Open Credit History"
                                            >
                                                <CreditCard size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col w-1/5 min-w-[120px]">
                                    <label className="text-xs font-semibold text-gray-600 mb-1">Bill Number</label>
                                    <input
                                        ref={billNumberInputRef}
                                        type="text"
                                        value={billNumber}
                                        onChange={e => setBillNumber(e.target.value)}
                                        className="form-input py-1.5 text-sm"
                                        placeholder="Enter Bill No"
                                    />
                                </div>

                                <div className="flex flex-col w-1/6 min-w-[120px]">
                                    <label className="text-xs font-semibold text-gray-600 mb-1">Bill Date</label>
                                    <input
                                        type="date"
                                        value={billDate}
                                        onChange={e => setBillDate(e.target.value)}
                                        className="form-input py-1.5 text-sm"
                                    />
                                </div>
                                <div className="flex items-center pt-5 w-full gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={addToCredit}
                                            onChange={(e) => setAddToCredit(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Add to Credit</span>
                                    </label>

                                    {/* Payment Mode Removed */}
                                </div>
                            </div>

                            {/* PRODUCTS "CART" LIST */}
                            <div className="flex-grow flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white mb-2 shadow-sm">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 font-bold text-xs text-gray-600 border-b items-center">
                                    <div className="col-span-1 flex items-center justify-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={addedProducts.length > 0 && selectedProductIds.size === addedProducts.length}
                                            onChange={toggleSelectAll}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>S.NO</span>
                                    </div>
                                    <div className="col-span-1 text-center">Image</div>
                                    <div className="col-span-2">Product Name</div>
                                    <div className="col-span-1">Category</div>
                                    <div className="col-span-1">Series</div>
                                    <div className="col-span-1 text-right">Buy Rate</div>
                                    <div className="col-span-1 text-center font-normal opacity-70">GST %</div>
                                    <div className="col-span-1 text-center font-normal opacity-70">P.Disc %</div>
                                    <div className="col-span-1 text-right">Sell Price</div>
                                    <div className="col-span-1 text-right text-indigo-600">WS Sell</div>
                                    <div className="col-span-1 text-center">Qty</div>
                                </div>

                                {/* Table Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {addedProducts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                                            <Layers size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">Added products will appear here</p>
                                        </div>
                                    ) : (
                                        addedProducts.map((row, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-b hover:bg-gray-50 text-sm items-center group">
                                                <div className="col-span-1 flex items-center justify-center gap-2 font-mono text-gray-400">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProductIds.has(row.id)}
                                                        onChange={() => toggleProductSelection(row.id)}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {addedProducts.length - i}
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    {row.imageFile ? (
                                                        <img src={URL.createObjectURL(row.imageFile)} alt="Preview" className="w-8 h-8 object-cover rounded shadow-sm" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400 font-medium">Img</div>
                                                    )}
                                                </div>
                                                <div className="col-span-2 font-medium text-gray-800 truncate" title={row.name}>{row.name} <span className="text-xs text-gray-400 font-normal block truncate">{row.barcode}</span></div>
                                                <div className="col-span-1 text-gray-600">{row.category}</div>
                                                <div className="col-span-1 text-gray-500 uppercase text-xs font-semibold">{row.series || '-'}</div>
                                                <div className="col-span-1 text-right font-mono text-gray-700">{(row.purchaseRate || 0).toFixed(2)}</div>
                                                <div className="col-span-1 text-center font-mono text-gray-400 text-xs">{row.purchaseGst || 0}%</div>
                                                <div className="col-span-1 text-center font-mono text-gray-400 text-xs">{row.purchaseDisc || 0}%</div>
                                                <div className="col-span-1 text-right font-mono text-blue-600 font-bold">{(row.price || 0).toFixed(2)}</div>
                                                <div className="col-span-1 text-right font-mono text-indigo-600 font-bold">{(row.wholesalePrice || row.price || 0).toFixed(2)}</div>
                                                <div className="col-span-1 text-center font-bold relative group-hover:text-transparent transition-all">
                                                    {row.stockQuantity}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveProduct(i)}
                                                        className="absolute inset-0 m-auto text-red-500 hover:bg-red-50 p-1 rounded hidden group-hover:flex items-center justify-center w-8 h-8"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* INPUT AREA (Bottom) */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-inner">
                                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Add New Product</div>
                                <div className="grid grid-cols-12 gap-3">
                                    {/* Image Upload + Name Input spans S.NO + Name columns */}
                                    <div className="col-span-1">
                                        <label
                                            className="relative flex h-[38px] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-blue-200 bg-white text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleImageSelection(e.dataTransfer.files);
                                            }}
                                        >
                                            {currentInput.imageFile ? (
                                                <img src={URL.createObjectURL(currentInput.imageFile)} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <PlusCircle size={20} className="text-gray-400" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                ref={imageInputRef}
                                                onChange={(e) => handleImageSelection(e.target.files)}
                                            />
                                            {currentInput.imageFile && (
                                                <button
                                                    type="button"
                                                    className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleInputChange('imageFile', null);
                                                    }}
                                                >
                                                    <X size={16} className="mx-auto text-white" />
                                                </button>
                                            )}
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Product Name *"
                                            ref={nameInputRef}
                                            value={currentInput.name}
                                            onChange={e => handleInputChange('name', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    categoryInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowRight') categoryInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm font-medium"
                                        />
                                    </div>
                                    <div className="col-span-1 relative">
                                        <input
                                            ref={categoryInputRef}
                                            type="text"
                                            value={categorySearchQuery}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCategorySearchQuery(val);
                                                handleInputChange('category', val);
                                                setIsCategoryDropdownOpen(true);
                                                setHighlightedCategoryIndex(0);
                                            }}
                                            onFocus={() => {
                                                setIsCategoryDropdownOpen(true);
                                                setHighlightedCategoryIndex(0);
                                            }}
                                            onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                                            onKeyDown={(e) => {
                                                const filtered = categories.filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()));
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setHighlightedCategoryIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setHighlightedCategoryIndex(prev => (prev > 0 ? prev - 1 : prev));
                                                } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (filtered.length > 0 && highlightedCategoryIndex >= 0 && highlightedCategoryIndex < filtered.length) {
                                                        handleSelectCategory(filtered[highlightedCategoryIndex]);
                                                    } else if (filtered.length > 0) {
                                                        handleSelectCategory(filtered[0]);
                                                    }
                                                    setTimeout(() => seriesInputRef.current?.focus(), 50);
                                                } else if (e.key === 'Escape') {
                                                    setIsCategoryDropdownOpen(false);
                                                } else if (e.key === 'ArrowLeft') {
                                                    e.preventDefault();
                                                    nameInputRef.current?.focus();
                                                } else if (e.key === 'ArrowRight') {
                                                    e.preventDefault();
                                                    seriesInputRef.current?.focus();
                                                }
                                            }}
                                            placeholder="Category"
                                            className="form-input w-full text-sm"
                                        />
                                        {isCategoryDropdownOpen && (
                                            <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mb-1 z-50 max-h-48 overflow-y-auto">
                                                {categories.filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase())).map((c, idx) => (
                                                    <div
                                                        key={c}
                                                        onMouseEnter={() => setHighlightedCategoryIndex(idx)}
                                                        onClick={() => handleSelectCategory(c)}
                                                        className={`px-3 py-1.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm ${highlightedCategoryIndex === idx ? 'bg-blue-100' : ''}`}
                                                    >
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="text"
                                            placeholder="Series"
                                            ref={seriesInputRef}
                                            value={currentInput.series}
                                            onChange={e => handleInputChange('series', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    purchaseInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') categoryInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') purchaseInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="Buy Price"
                                            ref={purchaseInputRef}
                                            value={currentInput.purchaseRate || ''}
                                            onChange={e => handleInputChange('purchaseRate', e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    purchaseGstInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') seriesInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') purchaseGstInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-right"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <input
                                            ref={purchaseGstInputRef}
                                            type="number"
                                            placeholder="GST %"
                                            value={currentInput.purchaseGst || ''}
                                            onChange={e => handleInputChange('purchaseGst', e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    purchaseDiscInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') purchaseInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') purchaseDiscInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-center"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <input
                                            ref={purchaseDiscInputRef}
                                            type="number"
                                            placeholder="P.Disc %"
                                            value={currentInput.purchaseDisc || ''}
                                            onChange={e => handleInputChange('purchaseDisc', e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    priceInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') purchaseGstInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') priceInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-center"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="Sell"
                                            ref={priceInputRef}
                                            value={currentInput.price || ''}
                                            onChange={e => handleInputChange('price', parseFloat(e.target.value))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    wholesalePriceInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') purchaseDiscInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') wholesalePriceInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-right border-blue-200"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="WS Sell"
                                            ref={wholesalePriceInputRef}
                                            value={currentInput.wholesalePrice || ''}
                                            onChange={e => handleInputChange('wholesalePrice', parseFloat(e.target.value))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    qtyInputRef.current?.focus();
                                                }
                                                if (e.key === 'ArrowLeft') priceInputRef.current?.focus();
                                                if (e.key === 'ArrowRight') qtyInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-right bg-indigo-50 border-indigo-200"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            ref={qtyInputRef}
                                            value={currentInput.stockQuantity || ''}
                                            onChange={e => handleInputChange('stockQuantity', parseFloat(e.target.value))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddProduct(e);
                                                if (e.key === 'ArrowLeft') priceInputRef.current?.focus();
                                            }}
                                            className="form-input w-full text-sm text-center font-bold"
                                        />
                                    </div>
                                    {/* ADD PRODUCT BUTTON */}
                                    <div className="col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => handleAddProduct()}
                                            className="w-full h-[38px] bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition shadow-sm"
                                            disabled={!currentInput.name?.trim() && !currentInput.imageFile}
                                            title="Add product to list"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 mt-auto border-t flex justify-between items-center bg-white">
                                <div className="text-sm text-gray-500">
                                    Total Items: <span className="font-bold text-gray-800">{addedProducts.length + (hasCurrentInputContent ? 1 : 0)}</span> | Total Purchase: <span className="font-bold text-green-600">₹{(totalPurchaseValue || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handlePrintBarcodes}
                                        className={`px-4 py-2.5 font-semibold rounded-lg flex items-center gap-2 transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200`}
                                    >
                                        <Printer size={18} /> Barcodes
                                    </button>
                                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">Close</button>

                                    <button
                                        type="submit"
                                        disabled={(addedProducts.length === 0 && !currentInput.name) || isSaving || localSaving}
                                        className={`px-6 py-2.5 font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 disabled:opacity-50 disabled:shadow-none`}
                                        title={"Save All (Products + Transaction)"}
                                    >
                                        <Save size={18} />
                                        {isSaving || localSaving ? "Saving..." : "Save all"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT SIDE: CREDIT PANEL (Collapsible) */}
                    {isCreditPanelOpen && selectedVendor && (
                        <div className="w-1/3 min-w-[350px] border-l pl-6 animate-in slide-in-from-right-10 duration-300 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <CreditCard size={20} className={productType === 'Retail' ? 'text-blue-600' : 'text-indigo-600'} />
                                    {productType === 'Retail' ? 'Supplier Credit' : 'Weaver Credit'}
                                </h3>
                                <button onClick={() => setIsCreditPanelOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm hover:underline">Close Panel</button>
                            </div>

                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                <SupplierCreditPanel
                                    supplierId={selectedVendor.id}
                                    supplierName={selectedVendor.name}
                                    onClose={() => setIsCreditPanelOpen(false)}
                                    onSuccess={handleCreditSuccess}
                                    initialAmount={totalPurchaseValue}
                                    initialDescription={`Purchase of ${addedProducts.length} items`}
                                    embedded={true}
                                    billDate={billDate}
                                    hideSubmitButton={true}
                                    hidePaidAmount={false}
                                    hideInvoice={true}
                                    onFormChange={setCreditFormDetails}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div >
        </div >
    );
};
export default MultiProductFormModal;
