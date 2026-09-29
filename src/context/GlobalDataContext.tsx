import React, { createContext, useContext, useCallback } from 'react';
import { productApi, customerApi, vendorApi, staffApi, billingApi, salonServiceApi, appointmentApi, packageApi, settingsApi, Product, Customer, Vendor, Staff, Bill, SalonService, Appointment, SalonPackage, GlobalSettings } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useCachedResource } from '@/hooks/useCachedResource';

interface GlobalDataContextType {
    products: Product[];
    customers: Customer[];
    vendors: Vendor[];
    staff: Staff[];
    bills: Bill[];
    holds: Bill[];
    cancelledBills: Bill[];
    salonServices: SalonService[];
    appointments: Appointment[];
    packages: SalonPackage[];
    settings: GlobalSettings | null;
    loading: boolean;
    isSyncing: boolean;
    refreshAll: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    refreshSalonServices: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
    refreshVendors: () => Promise<void>;
    refreshStaff: () => Promise<void>;
    refreshBills: () => Promise<void>;
    refreshHolds: () => Promise<void>;
    refreshCancelled: () => Promise<void>;
    refreshAppointments: () => Promise<void>;
    refreshPackages: () => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const GlobalDataContext = createContext<GlobalDataContextType>({
    products: [],
    customers: [],
    vendors: [],
    staff: [],
    bills: [],
    holds: [],
    cancelledBills: [],
    salonServices: [],
    appointments: [],
    packages: [],
    settings: null,
    loading: true,
    isSyncing: false,
    refreshAll: async () => { },
    refreshProducts: async () => { },
    refreshSalonServices: async () => { },
    refreshCustomers: async () => { },
    refreshVendors: async () => { },
    refreshStaff: async () => { },
    refreshBills: async () => { },
    refreshHolds: async () => { },
    refreshCancelled: async () => { },
    refreshAppointments: async () => { },
    refreshPackages: async () => { },
    refreshSettings: async () => { },
});

export const GlobalDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    const {
        data: products,
        loading: loadingProducts,
        isSyncing: syncingProducts,
        refresh: refreshProducts
    } = useCachedResource<Product[]>('global_products', productApi.getAll, { skip: !user, initialData: [] });

    const {
        data: salonServices,
        loading: loadingSalonServices,
        isSyncing: syncingSalonServices,
        refresh: refreshSalonServices
    } = useCachedResource<SalonService[]>('global_salon_services', salonServiceApi.getAll, { skip: !user, initialData: [] });

    const {
        data: customers,
        loading: loadingCustomers,
        isSyncing: syncingCustomers,
        refresh: refreshCustomers
    } = useCachedResource<Customer[]>('global_customers', customerApi.getAll, { skip: !user, initialData: [] });

    const {
        data: vendors,
        loading: loadingVendors,
        isSyncing: syncingVendors,
        refresh: refreshVendors
    } = useCachedResource<Vendor[]>('global_vendors', vendorApi.getAll, { skip: !user, initialData: [] });

    const {
        data: staff,
        loading: loadingStaff,
        isSyncing: syncingStaff,
        refresh: refreshStaff
    } = useCachedResource<Staff[]>('global_staff', staffApi.getAll, { skip: !user, initialData: [] });


    const {
        data: bills,
        loading: loadingBills,
        isSyncing: syncingBills,
        refresh: refreshBills
    } = useCachedResource<Bill[]>('global_bills', billingApi.getAll, { skip: !user, initialData: [] });

    const {
        data: holds,
        loading: loadingHolds,
        isSyncing: syncingHolds,
        refresh: refreshHolds
    } = useCachedResource<Bill[]>('global_holds', billingApi.getHoldBills, { skip: !user, initialData: [] });

    const {
        data: cancelledBills,
        loading: loadingCancelled,
        isSyncing: syncingCancelled,
        refresh: refreshCancelled
    } = useCachedResource<Bill[]>('global_cancelled_bills', billingApi.getCancelledBills, { skip: !user, initialData: [] });

    const {
        data: appointments,
        loading: loadingAppointments,
        isSyncing: syncingAppointments,
        refresh: refreshAppointments
    } = useCachedResource<Appointment[]>('global_appointments', appointmentApi.getAll, { skip: !user, initialData: [] });

    const {
        data: packages,
        loading: loadingPackages,
        isSyncing: syncingPackages,
        refresh: refreshPackages
    } = useCachedResource<SalonPackage[]>('global_packages', packageApi.getAll, { skip: !user, initialData: [] });

    const {
        data: settings,
        loading: loadingSettings,
        isSyncing: syncingSettings,
        refresh: refreshSettings
    } = useCachedResource<GlobalSettings | null>('global_settings', settingsApi.get, { skip: !user, initialData: null });

    const loading = loadingProducts || loadingSalonServices || loadingCustomers || loadingVendors || loadingStaff || loadingBills || loadingHolds || loadingCancelled || loadingAppointments || loadingPackages || loadingSettings;
    const isSyncing = syncingProducts || syncingSalonServices || syncingCustomers || syncingVendors || syncingStaff || syncingBills || syncingHolds || syncingCancelled || syncingAppointments || syncingPackages || syncingSettings;

    const refreshAll = useCallback(async () => {
        await Promise.allSettled([
            refreshProducts(),
            refreshSalonServices(),
            refreshCustomers(),
            refreshVendors(),
            refreshStaff(),
            refreshBills(),
            refreshHolds(),
            refreshCancelled(),
            refreshAppointments(),
            refreshPackages(),
            refreshSettings()
        ]);
    }, [refreshProducts, refreshSalonServices, refreshCustomers, refreshVendors, refreshStaff, refreshBills, refreshHolds, refreshCancelled, refreshAppointments, refreshPackages, refreshSettings]);

    // Automatically trigger fresh fetch whenever authenticated user or role changes
    React.useEffect(() => {
        if (user) {
            refreshAll();
        }
    }, [user?.uid, user?.role, refreshAll]);

    const value = {
        products: Array.isArray(products) ? products.map((p: any) => ({ ...p, systemType: 'Retail' })) : [],
        salonServices: Array.isArray(salonServices) ? salonServices : [],
        customers: Array.isArray(customers) ? customers : [],
        vendors: Array.isArray(vendors) ? vendors : [],
        staff: Array.isArray(staff) ? staff : [],
        bills: Array.isArray(bills) ? bills : [],
        holds: Array.isArray(holds) ? holds : [],
        cancelledBills: Array.isArray(cancelledBills) ? cancelledBills : [],
        appointments: Array.isArray(appointments) ? appointments : [],
        packages: Array.isArray(packages) ? packages : [],
        settings,
        loading,
        isSyncing,
        refreshAll,
        refreshProducts,
        refreshSalonServices,
        refreshCustomers,
        refreshVendors,
        refreshStaff,
        refreshBills,
        refreshHolds,
        refreshCancelled,
        refreshAppointments,
        refreshPackages,
        refreshSettings
    };

    return <GlobalDataContext.Provider value={value}>{children}</GlobalDataContext.Provider>;
};

export const useGlobalData = () => {
    return useContext(GlobalDataContext);
};
