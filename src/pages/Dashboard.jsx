import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    activeTables: 0,
    menuItems: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [ordersRes, tablesRes, menuRes, analyticsRes] = await Promise.all([
          API.get("/orders").catch(() => ({ data: [] })),
          API.get("/tables").catch(() => ({ data: [] })),
          API.get("/menu").catch(() => ({ data: [] })),
          API.get("/analytics/sales-summary").catch(() => ({ data: {} })),
        ]);

        setStats({
          totalOrders: ordersRes.data.length || 0,
          totalSales: analyticsRes.data.totalSales || 0,
          activeTables: tablesRes.data.filter((t) => t.occupied).length || 0,
          menuItems: menuRes.data.length || 0,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    loadStats();
  }, []);

  const quickActions = [
    { path: "/menu", label: "Menu Management", description: "Manage menu items" },
    { path: "/tables", label: "Tables", description: "View table status" },
    { path: "/orders", label: "Orders", description: "Create new orders" },
    { path: "/kitchen", label: "Kitchen", description: "Kitchen display" },
    { path: "/analytics", label: "Analytics", description: "View reports" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your restaurant operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Active Tables</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeTables}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Menu Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.menuItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="card hover:border-gray-300 transition-all duration-200 group"
              >
                <h3 className="text-base font-medium text-gray-900 mb-1 group-hover:text-gray-900">{action.label}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

