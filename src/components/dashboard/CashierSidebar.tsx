import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Printer, BarChart2, LogOut, Users, Briefcase, CalendarCheck, UserCheck, Calculator, Package, ChevronLeft, ChevronRight, LayoutDashboard, Scissors, Calendar, Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const CashierSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/cashier', icon: LayoutDashboard },
    { name: 'Billing', path: '/cashier/billing', icon: ShoppingCart },
    { name: 'Products', path: '/cashier/products', icon: Package },
    { name: 'Services', path: '/cashier/services', icon: Scissors },
    { name: 'Appointments', path: '/cashier/appointments', icon: Calendar },
    { name: 'Customers', path: '/cashier/customers', icon: Users },
    { name: 'Daily Actions', path: '/cashier/daily-actions', icon: CalendarCheck },
    { name: 'Printed Bills', path: '/cashier/printed-bills', icon: Printer },
    { name: 'Sales Report', path: '/cashier/sales-report', icon: BarChart2 },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out h-screen overflow-hidden flex-shrink-0 bg-blue-500 text-white flex flex-col p-4 sticky top-0`}>
      <div className={`flex items-center mb-8 pt-2 flex-shrink-0 relative h-8 ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
        <div className={`text-base font-bold whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'}`}>
          Anjus Beauty Saloon
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-md hover:bg-blue-600 transition-colors flex-shrink-0">
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-x-hidden overflow-y-auto scrollbar-hide pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-700 shadow-inner' : 'hover:bg-blue-600'
              } ${isCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-3'}`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-blue-400/30 overflow-x-hidden">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`w-full flex items-center py-3 rounded-lg hover:bg-blue-600 transition-colors ${isCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-3'}`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default CashierSidebar;
