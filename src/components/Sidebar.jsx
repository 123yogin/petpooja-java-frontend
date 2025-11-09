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
    { path: "/billing", label: "Billing", roles: ["CASHIER", "ADMIN"] },
    { path: "/kitchen", label: "Kitchen", roles: ["KITCHEN", "ADMIN"] },
    { path: "/inventory", label: "Inventory", roles: ["ADMIN"] },
    { path: "/analytics", label: "Analytics", roles: ["ADMIN", "MANAGER"] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "")
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Petpooja</h1>
        <p className="text-xs text-gray-500 mt-0.5">Restaurant POS</p>
      </div>
      
      <nav className="p-3 space-y-1">
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

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
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

