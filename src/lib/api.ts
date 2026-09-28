import axios from 'axios';
import { auth } from '@/lib/firebase';

const isDev = import.meta.env.MODE === 'development';
const PRODUCT_SERVICE_URL = isDev ? '/proxy' : 'https://product-service-demo-551828258445.asia-southeast1.run.app/api';
const BILLING_SERVICE_URL = isDev ? '/proxy' : 'https://billing-service-demo-551828258445.asia-southeast1.run.app/api';
const VENDOR_SERVICE_URL = isDev ? '/proxy' : 'https://vendor-service-demo-551828258445.asia-southeast1.run.app/api';
const REPORT_SERVICE_URL = isDev ? '/proxy' : 'https://billing-service-demo-551828258445.asia-southeast1.run.app/api';
const STAFF_SERVICE_URL = isDev ? '/proxy' : 'https://staff-service-demo-551828258445.asia-southeast1.run.app/api';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// --- Create a separate Axios instance for each service ---
const productService = axios.create({ baseURL: PRODUCT_SERVICE_URL, timeout: 15000 });
const billingService = axios.create({ baseURL: BILLING_SERVICE_URL, timeout: 15000 });
const vendorService = axios.create({ baseURL: VENDOR_SERVICE_URL, timeout: 15000 });
const reportService = axios.create({ baseURL: REPORT_SERVICE_URL, timeout: 15000 });
const staffService = axios.create({ baseURL: STAFF_SERVICE_URL, timeout: 15000 });
const customerService = axios.create({ baseURL: VENDOR_SERVICE_URL, timeout: 15000 });
const appointmentService = axios.create({ baseURL: '/api', timeout: 15000 });

// Firestore adapter interceptor
const firestoreAdapter = async (config: any) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  
  // Return a mock response adapter
  const respond = (data: any) => {
    config.adapter = async () => {
      return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
    };
    return config;
  };

  try {
    if (url.includes('/products/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'products'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/products/add') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'products'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }
    if (url.includes('/products/update') && method === 'patch') {
      const id = url.split('/').pop();
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      if (id) await updateDoc(doc(db, 'products', id), parsedData);
      return respond({ id, ...parsedData });
    }
    if (url.includes('/products/delete') && method === 'delete') {
      const id = url.split('/').pop();
      if (id) await deleteDoc(doc(db, 'products', id));
      return respond({ success: true });
    }
    if (url.includes('/products/categories') && method === 'get') {
      const snap = await getDocs(collection(db, 'categories'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/products/barcode/') && method === 'get') {
      const barcode = url.split('/products/barcode/')[1];
      if (!barcode) return respond(null);
      const q = query(collection(db, 'products'), where('barcode', '==', decodeURIComponent(barcode)));
      const snap = await getDocs(q);
      if (snap.empty) return respond(null);
      return respond({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
    
    // Salon Services
    if (url.includes('/salon-services/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'services'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/salon-services/add') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'services'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }
    if (url.includes('/salon-services/update') && method === 'patch') {
      const id = url.split('/').pop();
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      if (id) await updateDoc(doc(db, 'services', id), parsedData);
      return respond({ id, ...parsedData });
    }
    if (url.includes('/salon-services/delete') && method === 'delete') {
      const id = url.split('/').pop();
      if (id) await deleteDoc(doc(db, 'services', id));
      return respond({ success: true });
    }
    if (url.includes('/salon-services/categories') && method === 'get') {
      const snap = await getDocs(collection(db, 'salon_service_categories'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // Customers
    if (url.includes('/customers/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'customers'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/customers/add') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'customers'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }

    // Billing
    if (url.includes('/billing/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'bills'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/billing/create') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'bills'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }

    // Staff
    if (url.includes('/staff/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'staff'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/staff/add') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'staff'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }

    // Commissions
    if (url.includes('/staff/commissions/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'staff_commissions'));
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const urlObj = new URL('http://localhost' + url);
      const yearMonth = urlObj.searchParams.get('yearMonth');
      if (yearMonth) {
        results = results.filter((c: any) => c.date && c.date.startsWith(yearMonth));
      }
      return respond(results);
    }
    if (url.includes('/staff/commissions/') && method === 'get' && !url.includes('/all')) {
      // /staff/commissions/:staffId
      const parts = url.split('?')[0].split('/');
      const staffId = parts[parts.length - 1];
      const snap = await getDocs(collection(db, 'staff_commissions'));
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => c.staffId === staffId);
      const urlObj = new URL('http://localhost' + url);
      const yearMonth = urlObj.searchParams.get('yearMonth');
      if (yearMonth) {
        results = results.filter((c: any) => c.date && c.date.startsWith(yearMonth));
      }
      return respond(results);
    }
    if (url.includes('/staff/commissions') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'staff_commissions'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }
    if (url.includes('/staff/commissions/') && url.includes('/pay') && method === 'patch') {
      const parts = url.split('?')[0].split('/');
      // /staff/commissions/:id/pay
      const id = parts[parts.length - 2];
      await updateDoc(doc(db, 'staff_commissions', id), { status: 'PAID' });
      return respond({ id, status: 'PAID' });
    }
    
    // Appointments
    if (url.includes('/appointments/all') && method === 'get') {
      const snap = await getDocs(collection(db, 'appointments'));
      return respond(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (url.includes('/appointments/add') && method === 'post') {
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const ref = await addDoc(collection(db, 'appointments'), parsedData);
      return respond({ id: ref.id, ...parsedData });
    }
    if (url.includes('/appointments/update') && method === 'patch') {
      const id = url.split('/').pop();
      const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      if (id) await updateDoc(doc(db, 'appointments', id), parsedData);
      return respond({ id, ...parsedData });
    }
    if (url.includes('/appointments/delete') && method === 'delete') {
      const id = url.split('/').pop();
      if (id) await deleteDoc(doc(db, 'appointments', id));
      return respond({ success: true });
    }

    // Default fallback for unmapped endpoints to prevent crashes
    return respond([]);
  } catch (e) {
    console.error("Firestore adapter error", e);
    return respond([]);
  }
};

// Apply interceptors
productService.interceptors.request.use(firestoreAdapter);
billingService.interceptors.request.use(firestoreAdapter);
vendorService.interceptors.request.use(firestoreAdapter);
reportService.interceptors.request.use(firestoreAdapter);
staffService.interceptors.request.use(firestoreAdapter);
customerService.interceptors.request.use(firestoreAdapter);
appointmentService.interceptors.request.use(firestoreAdapter);

export {
  productService,
  billingService,
  vendorService,
  reportService,
  customerService,
  staffService,
  appointmentService,
};

// --- Types ---

export interface Appointment {
  id?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  serviceIds: string[];
  staffId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  emergencyPhone?: string;
  role: string;
  isActive: boolean; // Added for compatibility
  createdAt?: string;
  baseSalary?: number;
  allowedPermHours?: number;
  profilePicUrl?: string;
  accountNumber?: string;
  ifscCode?: string;
  commissionPercentage?: number;
}

export interface Role {
  id?: string;
  name: string;
  permissions?: string[];
  description?: string;
}

export interface Attendance {
  id?: string;
  staffId: string;
  staffName: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'PERMISSION' | 'FULL_DAY';
  remarks?: string; // Added for compatibility
  permissionTime?: string;
  permissionTimeRange?: string; // New field
  timestamp?: string; // Added for compatibility
  inTime?: string;
  outTime?: string;
}

// --- Staff API ---
export const staffApi = {
  // Staff Management
  getAll: async () => {
    const res = await staffService.get<Staff[]>('/staff/all');
    if (Array.isArray(res.data)) {
      res.data = res.data.map((s: any) => ({
        ...s,
        id: s.id || s._id || '',
        isActive: s.isActive !== undefined ? s.isActive : (s.active !== undefined ? s.active : true)
      }));
    }
    return res;
  },
  getById: async (id: string) => {
    const res = await staffService.get<Staff>(`/staff/${id}`);
    if (res.data) {
      const s: any = res.data;
      res.data = {
        ...s,
        id: s.id || s._id || '',
        isActive: s.isActive !== undefined ? s.isActive : (s.active !== undefined ? s.active : true)
      };
    }
    return res;
  },
  add: (data: Partial<Staff>) => {
    const payload = { ...data, active: data.isActive };
    return staffService.post('/staff/add', payload);
  },
  update: (id: string, data: Partial<Staff>) => {
    const payload = { ...data, active: data.isActive };
    return staffService.patch(`/staff/${id}`, payload);
  },
  delete: (id: string) => staffService.delete(`/staff/${id}`),

  // Role Management
  getRoles: () => staffService.get<Role[]>('/staff/roles'),
  addRole: (role: Role) => staffService.post('/staff/roles', role),
  updateRole: (id: string, role: Role) => staffService.put(`/staff/roles/${id}`, role),
  deleteRole: (id: string) => staffService.delete(`/staff/roles/${id}`),

  // Attendance Management
  getDailyAttendance: (date: string) => staffService.get<any>(`/staff/attendance/day/${date}`),

  markAttendance: (data: Attendance) => {
    const payload = { ...data, type: data.status }; // Map status -> type for backend DTO
    return staffService.post('/staff/attendance/mark', payload);
  },

  markBulkAttendance: (data: Attendance[]) => {
    const payload = data.map(d => ({ ...d, type: d.status })); // Map status -> type for bulk
    return staffService.post('/staff/attendance/mark-bulk', payload);
  },

  getMonthAttendance: (year: string, month: string) => staffService.get<any[]>(`/staff/attendance/month/${year}/${month}`),
  getStaffMonthAttendance: (staffId: string, yearMonth: string) => staffService.get<any>(`/staff/attendance/staff/${staffId}/${yearMonth}`),

  // Salary
  getSalarySlip: (staffId: string, yearMonth: string) => staffService.get<SalarySlip>(`/staff/salary/${staffId}/${yearMonth}`),

  // Commissions
  getAllCommissions: (yearMonth?: string) => staffService.get<Commission[]>(`/staff/commissions/all${yearMonth ? `?yearMonth=${yearMonth}` : ''}`),
  getStaffCommissions: (staffId: string, yearMonth?: string) =>
    staffService.get<Commission[]>(`/staff/commissions/${staffId}${yearMonth ? `?yearMonth=${yearMonth}` : ''}`),
  payCommission: (id: string, paymentMethod?: string) => staffService.patch(`/staff/commissions/${id}/pay${paymentMethod ? `?paymentMethod=${paymentMethod}` : ''}`),
  addCommission: (data: any) => staffService.post('/staff/commissions', data),
};

export interface SalarySlip {
  staffId: string;
  staffName: string;
  month: string;            // Format: "YYYY-MM"
  baseSalary: number;       // Monthly Fixed Salary

  // Attendance Stats
  totalDays: number;
  presentDays: number;      // Full Days + Permission Days
  absentDays: number;
  halfDays: number;
  sickLeaves: number;       // Paid leaves
  permissionHoursTaken: number;

  // Calculations
  perDaySalary: number;
  perHourSalary: number;

  // Financials
  lopAmount: number;        // Deduction for Absent + Half Days
  permissionDeduction: number; // Deduction for excess hours
  netSalary: number;        // Final Amount to be paid
}

export interface CreditTransaction {
  id?: string;
  vendorId?: string;
  weaverId?: string;
  invoice?: string; // Added for compatibility with new backend
  amount: number;
  paidAmount: number;
  balance: number;
  paymentMode: 'CASH' | 'ONLINE' | 'CHEQUE' | 'CREDIT' | 'UPI';
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  description?: string;
  date?: string;
  createdAt?: string;
  products?: Product[]; // Added list of products
  lastPaymentDate?: string;
  paymentRemarks?: string;
  paymentHistory?: PaymentHistoryEntry[];
}

export interface PaymentHistoryEntry {
  amount: number;
  paymentMode: string;
  description?: string;
  paymentDate: string;
  balanceAfterPayment: number;
  statusAfterPayment: string;
}

export interface Vendor {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  gstin: string;
  address: string;
  vendorInvoice?: string; // New field
  transactions?: string[];
}

export const mapVendorFromBackend = (v: any): Vendor => ({
  id: v.id || v._id || '',
  name: v.name,
  nickname: v.nickname || '',
  phone: v.phone || v.contact || '',
  gstin: v.gstin || v.gstIn || v.gst || v.GST || v.GSTIN || v.gstNo || '',
  address: v.address || '',
  vendorInvoice: v.vendorInvoice || '', // Map new field
  transactions: v.transactions || []
});

// Vendor API Wrapper
export const vendorApi = {
  getAll: async () => {
    const res = await vendorService.get<Vendor[]>('/vendors/all');
    let data: any[] = [];
    if (Array.isArray(res.data)) {
      data = res.data;
    } else if (res.data && Array.isArray((res.data as any).vendors)) {
      data = (res.data as any).vendors;
    }

    // In-place update of data to ensure type safety downstream
    const mapped = data.map(mapVendorFromBackend);
    res.data = mapped;
    return res;
  },
  getVendor: (id: string) => vendorService.get<Vendor>(`/vendors/get/${id}`),
  addVendor: (data: Partial<Vendor>) => vendorService.post('/vendors/add', data),
  updateVendor: (id: string, data: Partial<Vendor>) => vendorService.patch(`/vendors/update/${id}`, data),
  deleteVendor: (id: string) => vendorService.delete(`/vendors/delete/${id}`),

  // Transactions
  getCredits: (vendorId: string) => vendorService.get<CreditTransaction[]>(`/vendors/transactions/vendor/${vendorId}`),
  addCredit: (data: CreditTransaction) => vendorService.post('/vendors/transactions/add', data),
  updateCredit: (id: string, data: Partial<CreditTransaction>) => vendorService.patch(`/vendors/transactions/update/${id}`, data), // Kept for compat if needed, simplified in new backend
  recordPayment: (id: string, amount: number, paymentMode?: string, description?: string) =>
    vendorService.put(`/vendors/transactions/${id}/pay`, null, { params: { amount, paymentMode, paymentDescription: description } }),
  deleteCredit: (id: string) => vendorService.delete(`/vendors/transactions/delete/${id}`),
  getCreditsRange: (start: string, end: string) => vendorService.get<CreditTransaction[]>(`/vendors/transactions/range?startDate=${start}&endDate=${end}`),
  syncProductDetails: (productId: string, rate: number, gst: number, stock: number, syncStock?: boolean) => vendorService.put(`/vendors/transactions/sync-details/${productId}?rate=${rate}&gst=${gst}&stock=${stock}&syncStock=${syncStock !== false}`),
};



// --- Product API ---

export interface Category {
  id?: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  purchaseRate: number;
  purchaseGst?: number;
  purchaseDisc?: number;
  sellingPrice: number;
  price: number;
  discount: number;
  stockQuantity: number | null;
  vendorId: string;
  vendorName: string;
  barcode: string;
  barcodeImageUrl?: string;
  purchaseDate?: string;
  createdAt?: string;
  updatedAt?: string;
  mrp?: number;
  creditTransactionId?: string;
  billNo?: string;
  imageUrl?: string;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'DISCONTINUED';
  active?: boolean;
  inventoryTracking: 'NOT_TRACKED' | 'TRACKED';
  reorderLevel?: number | null;
  batchNumber?: string;
  expiryDate?: string;
  unit?: string;
}

// Helper to map Backend Product to Frontend Product (handling alias)
const mapProductFromBackend = (p: any): Product | null => {
  if (!p) return null;
  const tracking = p.inventoryTracking || 'NOT_TRACKED';
  return {
    ...p,
    id: p.id || p._id || '',
    name: p.name || '',
    brand: p.brand || '',
    category: p.category || '',
    subcategory: p.subcategory || '',
    sku: p.sku || '',
    billNo: p.billNo || p.billno || p.bill_number || p.invoiceNo || p.invoice_no || '',
    barcode: p.barcode || p.productCode || '', 
    purchaseDate: p.purchaseDate || p.createdAt || '',
    price: parseFloat(p.sellingPrice !== undefined ? p.sellingPrice : (p.price || 0)) || 0,
    sellingPrice: parseFloat(p.sellingPrice || 0) || 0,
    mrp: parseFloat(p.mrp || p.MRP || p.Mrp || 0) || 0,
    purchaseRate: parseFloat(p.purchaseRate || 0) || 0,
    stockQuantity: tracking === 'NOT_TRACKED' ? null : (parseInt(p.stockQuantity || 0) || 0),
    discount: parseFloat(p.discount || 0) || 0,
    purchaseGst: Number(p.purchaseGst) || 0,
    purchaseDisc: Number(p.purchaseDisc) || 0,
    availabilityStatus: p.availabilityStatus || 'AVAILABLE',
    active: p.active !== undefined ? p.active : true,
    inventoryTracking: tracking,
    reorderLevel: p.reorderLevel ? parseInt(p.reorderLevel) : null,
    batchNumber: p.batchNumber || '',
    expiryDate: p.expiryDate || '',
    unit: p.unit || '',
    vendorId: p.vendorId || '',
    vendorName: p.vendorName || '',
    imageUrl: p.imageUrl || '',
  };
};

// Helper to map Frontend Product to Backend Product
const mapProductToBackend = (p: Partial<Product>): any => {
  const { price, sellingPrice, stockQuantity, inventoryTracking, ...rest } = p;
  return {
    ...rest,
    sellingPrice: sellingPrice !== undefined ? sellingPrice : price,
    stockQuantity: inventoryTracking === 'NOT_TRACKED' ? null : stockQuantity,
    inventoryTracking,
  };
};

export const productApi = {
  getAll: async (params?: any) => {
    const res = await productService.get<Product[]>('/products/all', { params });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapProductFromBackend);
    }
    return res;
  },
  get: async (id: string) => {
    const res = await productService.get<Product>(`/products/get/${id}`);
    if (res.data) res.data = mapProductFromBackend(res.data);
    return res;
  },
  getByBarcode: async (barcode: string) => {
    const res = await productService.get<Product>(`/products/barcode/${barcode}`);
    if (res.data) res.data = mapProductFromBackend(res.data);
    return res;
  },
  add: (data: Partial<Product>) => productService.post('/products/add', mapProductToBackend(data)),
  update: (id: string, data: Partial<Product>) => productService.patch(`/products/update/${id}`, mapProductToBackend(data)),
  delete: (id: string) => productService.delete(`/products/delete/${id}`),
  updateStock: (id: string, change: number | null, set: number | null) =>
    productService.put(`/products/${id}/stock`, null, { params: { change, set } }),
  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return productService.post(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (id: string) => productService.delete(`/products/${id}/image`),

  // Categories
  getCategories: () => productService.get<Category[]>('/products/categories'),
  addCategory: (data: Category) => productService.post('/products/categories/add', data),
  updateCategory: (id: string, data: Partial<Category>) => productService.patch(`/products/categories/${id}`, data),
  deleteCategory: (id: string) => productService.delete(`/products/categories/delete/${id}`),

  // Date Range
  getByDateRange: async (startDate: string, endDate: string) => {
    const res = await productService.get<Product[]>(`/products/by-dates?startDate=${startDate}&endDate=${endDate}`);
    if (Array.isArray(res.data)) res.data = res.data.map(mapProductFromBackend);
    return res;
  }
};

// --- Salon Service API ---

export interface SalonServiceCategory {
  id?: string;
  name: string;
}

export interface SalonService {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  price: number;
  duration?: number; // duration in minutes
  active: boolean;
  commissionType?: 'PERCENTAGE' | 'FIXED';
  commissionValue?: number;
  eligibleStaffIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const mapSalonServiceFromBackend = (s: any): SalonService => {
  return {
    ...s,
    id: s.id || s._id || '',
    name: s.name || '',
    categoryId: s.categoryId || '',
    price: parseFloat(s.price || 0) || 0,
    active: s.active !== undefined ? s.active : true,
    duration: parseInt(s.duration || 0) || 0,
    commissionType: s.commissionType || 'PERCENTAGE',
    commissionValue: parseFloat(s.commissionValue || 0) || 0,
    eligibleStaffIds: Array.isArray(s.eligibleStaffIds) ? s.eligibleStaffIds : [],
  };
};

export const salonServiceApi = {
  getAll: async () => {
    const res = await productService.get<SalonService[]>('/salon-services/all');
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapSalonServiceFromBackend);
    }
    return res;
  },
  get: async (id: string) => {
    const res = await productService.get<SalonService>(`/salon-services/get/${id}`);
    if (res.data) res.data = mapSalonServiceFromBackend(res.data);
    return res;
  },
  add: (data: Partial<SalonService>) => productService.post('/salon-services/add', data),
  update: (id: string, data: Partial<SalonService>) => productService.patch(`/salon-services/update/${id}`, data),
  delete: (id: string) => productService.delete(`/salon-services/delete/${id}`),

  // Categories
  getCategories: () => productService.get<SalonServiceCategory[]>('/salon-services/categories'),
  addCategory: (data: SalonServiceCategory) => productService.post('/salon-services/categories/add', data),
  updateCategory: (id: string, data: Partial<SalonServiceCategory>) => productService.patch(`/salon-services/categories/${id}`, data),
  deleteCategory: (id: string) => productService.delete(`/salon-services/categories/delete/${id}`),
};


// --- Billing API ---

export interface BillDetails {
  type?: 'PRODUCT' | 'SERVICE';
  productId?: string;
  serviceId?: string;
  staffId?: string;
  staffName?: string;
  quantity: number;
  productName: string; // Used for both product and service names backward compatible
  unitPrice: number;
  gstRate: number;
  discountRate: number;
  subtotal?: number;
  discountAmount?: number;
  gstAmount?: number;
  netAmount?: number;
  gstPercent?: number;
  purchaseRate?: number;
  purchaseGstRate?: number;
  baseAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  finalAmount?: number;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
}

export interface Bill {
  id?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  status?: string; 
  customerId?: string; 
  customerName: string;
  customerPhone: number;
  customerEmail?: string;
  customerAddress?: string;
  customerGst?: string; 
  cashierId?: string;
  items: BillDetails[];
  totalDiscountAmount?: number;
  totalGstAmount?: number;
  finalAmount?: number;
  amountPaid?: number;
  pendingAmount?: number;
  paymentMethod: string;
  paymentHistory?: PaymentHistoryEntry[];
  billType?: string; 
  staffId?: string; 
  staffCommissionPercentage?: number; 
  staffCommissionAmount?: number; 
  staffCommissionStatus?: 'PAID' | 'UNPAID'; 
  cashAmount?: number;
  onlineAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  enableExpiryReminder?: boolean;
  expiryDays?: number;
}

export const billingApi = {
  create: async (data: Bill) => {
    try {
      const response = await fetch("http://localhost:5000/api/process-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to process bill");
      // Format the response to match what the app expects (an Axios response with .data)
      return { data: { id: result.billId, ...result.bill } };
    } catch (e) {
      console.error("Backend billing error:", e);
      throw e;
    }
  },
  update: (id: string, data: Partial<Bill>) => billingService.patch(`/billing/update/${id}`, data), // Added generic update
  hold: (data: Bill) => billingService.post('/billing/hold', data),

  cancelHold: (id: string) => billingService.put(`/billing/${id}/cancel`),
  returnBill: (id: string, data: Bill) => billingService.put(`/billing/${id}/return`, data),
  pay: (id: string, data: any) => billingService.patch(`/billing/${id}/pay`, data),
  recordPayment: (id: string, amount: number, paymentMode: string, description?: string) =>
    billingService.patch(`/billing/${id}/record-payment`, { amount, paymentMode, description }),
  getAll: () => billingService.get<Bill[]>('/billing/all'),
  getByRange: (start: string, end: string) => billingService.get<Bill[]>(`/billing/range?start=${start}&end=${end}&startDate=${start}&endDate=${end}`),
  search: (name?: string, phone?: number) => billingService.get<Bill[]>(`/billing/search`, { params: { name, phone } }),
  // Get single bill by ID
  getById: (id: string) => billingService.get<Bill>(`/billing/${encodeURIComponent(id)}`),
  delete: (id: string) => billingService.delete(`/billing/${id}`),
  // Compatibility
  getProduct: (barcode: string) => billingService.get<BillDetails>(`/billing/product/${barcode}`),
  getHoldBills: () => billingService.get<Bill[]>('/billing/hold'),
  getCancelledBills: () => billingService.get<Bill[]>('/billing/cancelled'),
  getNotifications: () => billingService.get<Bill[]>('/billing/notifications'),
};

// --- Customer API ---

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  gstin?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  totalPaid?: number; // Added totalPaid
  pendingBalance?: number; // Added pendingBalance
  visitCount?: number;
  lastVisit?: string;
  createdAt?: string;
}

export interface Viewer {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  state: string;
  creditAmount: number;
  totalPaidAmount: number;
  pendingBalance: number;
  createdAt?: string;
}





export interface CustomerPurchase {
  id: string;
  date: string;
  amount: number;
  paidAmount?: number; // Added paidAmount
  balance?: number;    // Added balance
  paymentMethod: string;
  items?: any[];
  status?: string;
  cashAmount?: number;
  onlineAmount?: number;
  paymentHistory?: PaymentHistoryEntry[]; // Added paymentHistory
}

export const mapCustomerFromBackend = (c: any): Customer => ({
  ...c,
  id: c.id || c._id || '',
  phone: c.phone || c.contact || '',
  address: c.address || c.Address || c.location || '',
  gstin: c.gstin || c.gst || c.gstNo || '',
});

export const mapViewerFromBackend = (v: any): Viewer => ({
  ...v,
  id: v.id || v._id || '',
  phone: v.phone || v.contact || '',
  nickname: v.nickname || '',
  state: v.state || '',
  creditAmount: Number(v.creditAmount) || 0,
  totalPaidAmount: Number(v.totalPaidAmount) || 0,
  pendingBalance: Number(v.pendingBalance) || 0,
});

export const customerApi = {
  add: (data: Partial<Customer>) => customerService.post('/customers/add', data),
  getById: async (id: string) => {
    const res = await customerService.get<Customer>(`/customers/get/${id}`);
    if (res.data) {
      res.data = mapCustomerFromBackend(res.data);
    }
    return res;
  },
  getAll: async () => {
    const res = await customerService.get<Customer[]>('/customers/all');
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map(mapCustomerFromBackend);
    }
    return res;
  },
  update: (id: string, data: Partial<Customer>) => customerService.patch(`/customers/update/${id}`, data),
  delete: (id: string) => customerService.delete(`/customers/delete/${id}`),
  getHistory: async (id: string) => {
    // Fallback implementation if no direct endpoint exists
    return billingService.get('/billing/history/customer/' + id).catch(() => ({ data: [] }));
  }
};

/*
export const viewerApi = {
  add: (data: Partial<Viewer>) => customerService.post('/weavers/add', data),
  getAll: async () => {
    const res = await customerService.get<Viewer[]>('/weavers/all');
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map(mapViewerFromBackend);
    }
    return res;
  },
  update: (id: string, data: Partial<Viewer>) => customerService.patch(`/weavers/update/${id}`, data),
  delete: (id: string) => customerService.delete(`/weavers/delete/${id}`),
};

export const manufacturingApi = {
  add: (viewerId: string, data: ManufacturingRecord) => customerService.post(`/weavers/${viewerId}/manufacturing/add`, data),
  getAll: (viewerId: string) => customerService.get<ManufacturingRecord[]>(`/weavers/${viewerId}/manufacturing/all`),
  update: (viewerId: string, recordId: string, data: Partial<ManufacturingRecord>) =>
    customerService.patch(`/weavers/${viewerId}/manufacturing/update/${recordId}`, data),
  delete: (viewerId: string, recordId: string) =>
    customerService.delete(`/weavers/${viewerId}/manufacturing/delete/${recordId}`),
};

export const polishingApi = {
  add: (viewerId: string, data: PolishingRecord) => customerService.post(`/weavers/${viewerId}/polishing/add`, data),
  getAll: (viewerId: string) => customerService.get<PolishingRecord[]>(`/weavers/${viewerId}/polishing/all`),
  update: (viewerId: string, recordId: string, data: Partial<PolishingRecord>) =>
    customerService.patch(`/weavers/${viewerId}/polishing/update/${recordId}`, data),
  delete: (viewerId: string, recordId: string) =>
    customerService.delete(`/weavers/${viewerId}/polishing/delete/${recordId}`),
};
*/

export const rawMaterialApi = {
  add: (data: RawMaterial) => customerService.post('/raw-materials/add', data),
  getAll: () => customerService.get<RawMaterial[]>('/raw-materials/all'),
  update: (id: string, data: Partial<RawMaterial>, isInlineEdit?: boolean) => 
    customerService.patch(`/raw-materials/update/${id}${isInlineEdit ? '?isInlineEdit=true' : ''}`, data),
  delete: (id: string) => customerService.delete(`/raw-materials/delete/${id}`),
};

/*
export const weaverProductApi = {
  add: (data: Partial<WeaverProduct>) => customerService.post('/weaver-products/add', data),
  getAll: () => customerService.get<WeaverProduct[]>('/weaver-products/all'),
  getByWeaver: (weaverId: string) => customerService.get<WeaverProduct[]>(`/weaver-products/weaver/${weaverId}`),
  getByBarcode: (barcode: string) => customerService.get<WeaverProduct>(`/weaver-products/barcode/${barcode}`),
  update: (id: string, data: Partial<WeaverProduct>) => customerService.patch(`/weaver-products/update/${id}`, data),
  updateQty: (id: string, qty: number) => customerService.patch(`/weaver-products/${id}/qty?qty=${qty}`),
  delete: (id: string) => customerService.delete(`/weaver-products/delete/${id}`),
  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return customerService.post(`/weaver-products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (id: string) => customerService.delete(`/weaver-products/${id}/image`),
};

export const weaverCreditApi = {
  getCredits: (weaverId: string) => customerService.get<CreditTransaction[]>(`/weavers/transactions/weaver/${weaverId}`),
  addCredit: (data: CreditTransaction) => customerService.post('/weavers/transactions/add', data),
  updateCredit: (id: string, data: Partial<CreditTransaction>) => customerService.patch(`/weavers/transactions/update/${id}`, data),
  recordPayment: (id: string, amount: number, paymentMode?: string, description?: string) =>
    customerService.put(`/weavers/transactions/${id}/pay`, null, { params: { amount, paymentMode, paymentDescription: description } }),
  deleteCredit: (id: string) => customerService.delete(`/weavers/transactions/delete/${id}`),
  getCreditsRange: (start: string, end: string) => customerService.get<CreditTransaction[]>(`/weavers/transactions/range?startDate=${start}&endDate=${end}`),
};
*/



// --- DayBook API ---

export interface DayBookEntry {
  id?: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date?: string;
  category?: string; // "System" means it came from auto-calculated sales
  paymentMethod: "Cash" | "UPI" | "Card";
}

export interface DayBookSummaryResponse {
  salesSummary: {
    total: number;
    cash: number;
    upi: number;
    card: number;
  };
  entries: DayBookEntry[];
}

export interface CashTally {
  date: string; // YYYY-MM-DD
  openingBalance: number;
  denominations: { [key: string]: number }; // e.g., "500": 10
  totalCashHand: number;
}

export const daybookApi = {
  getSummary: (date?: string, startDate?: string, endDate?: string) => {
    let url = '/billing/daybook/summary';
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return billingService.get<DayBookSummaryResponse>(url);
  },
  addEntry: (entry: DayBookEntry) => billingService.post('/billing/daybook/add', entry),
  getTally: (date: string) => billingService.get<CashTally>(`/billing/daybook/tally?date=${date}`),
  saveTally: (tally: CashTally) => billingService.post('/billing/daybook/tally', tally),

  // Edit/Delete
  updateEntry: (id: string, entry: Partial<DayBookEntry>) => billingService.patch(`/billing/daybook/update/${id}`, entry),
  deleteEntry: (id: string) => billingService.delete(`/billing/daybook/delete/${id}`),
  getRange: (start: string, end: string) => billingService.get<{
    summary: { totalIncome: number; totalExpense: number };
    dailyBreakdown: { date: string; income: number; expense: number }[];
    chartData: { date: string; income: number; expense: number }[];
  }>(`/billing/daybook/range?start=${start}&end=${end}&startDate=${start}&endDate=${end}`),
};



export interface Commission {
  id: string;
  brokerId?: string;
  staffId?: string;
  staffName?: string;
  billId: string;
  date: string;
  amount: number; // Sale amount
  commissionAmount?: number; // Broker commission
  staffCommissionAmount?: number; // Staff commission
  status: 'UNPAID' | 'PAID';
  paidDate?: string;
  paymentMethod?: string; // Cash | UPI | Card — used for expense bucketing
}


// --- Estimation API ---

export interface Estimation {
  id?: string;
  estimationId: string;
  customerName: string;
  customerPhone: number;
  customerAddress?: string;
  customerGst?: string;
  items: BillDetails[];
  totalDiscountAmount?: number;
  totalGstAmount?: number;
  finalAmount?: number;
  systemType?: 'Retail' | 'Wholesale'; // Added systemType
  createdAt?: string;
}

export const estimationApi = {
  create: (data: Estimation) => billingService.post('/estimations/create', data),
  getAll: () => billingService.get<Estimation[]>('/estimations/all'),
  getById: (id: string) => billingService.get<Estimation>(`/estimations/${encodeURIComponent(id)}`),
  update: (id: string, data: Estimation) => billingService.put(`/estimations/${encodeURIComponent(id)}`, data),
};

export const appointmentApi = {
  getAll: () => appointmentService.get<Appointment[]>('/appointments/all'),
  add: (data: Partial<Appointment>) => appointmentService.post('/appointments/add', data),
  update: (id: string, data: Partial<Appointment>) => appointmentService.patch(`/appointments/update/${id}`, data),
  delete: (id: string) => appointmentService.delete(`/appointments/delete/${id}`),
};