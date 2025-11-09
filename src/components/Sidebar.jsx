import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", roles: ["ADMIN", "CASHIER", "KITCHEN", "MANAGER"] },
    { path: "/menu", label: "Menu", roles: ["ADMIN"] },
    { path: "/tables", label: "Tables", roles: ["ADMIN", "CASHIER"] },
    { path: "/orders", label: "Orders", roles: ["CASHIER", "ADMIN"] },
    { path: "/billing", label: "Billing", roles: ["CASHIER", "ADMIN", "MANAGER"] },
    { path: "/kitchen", label: "Kitchen", roles: ["KITCHEN", "ADMIN"] },
    { path: "/inventory", label: "Inventory", roles: ["ADMIN"] },
    { path: "/suppliers", label: "Suppliers", roles: ["ADMIN"] },
    { path: "/purchase-orders", label: "Purchase Orders", roles: ["ADMIN"] },
    { path: "/customers", label: "Customers", roles: ["ADMIN", "CASHIER", "MANAGER"] },
    { path: "/tasks", label: "Tasks", roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"] },
    { path: "/employees", label: "Employees", roles: ["ADMIN", "MANAGER"] },
    { path: "/attendance", label: "Attendance", roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"] },
    { path: "/leaves", label: "Leaves", roles: ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"] },
    { path: "/payroll", label: "Payroll", roles: ["ADMIN", "MANAGER"] },
    { path: "/accounts-receivable", label: "Accounts Receivable", roles: ["ADMIN", "CASHIER", "MANAGER"] },
    { path: "/outlets", label: "Outlets", roles: ["ADMIN", "MANAGER"] },
    { path: "/analytics", label: "Analytics", roles: ["ADMIN", "MANAGER"] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "")
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-30">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Petpooja</h1>
        <p className="text-xs text-gray-500 mt-0.5">Restaurant POS</p>
      </div>
      
      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-20">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium ${
              isActive(item.path)
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info - Fixed at bottom */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {user?.role?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.role || "User"}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

