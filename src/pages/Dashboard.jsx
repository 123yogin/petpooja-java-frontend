import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AuthContext } from "../context/AuthContext";
import { can } from "../utils/rolePermissions";

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const StatCard = ({ title, value, change, isLoading, icon }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== null && change !== undefined && (
            <div className="flex items-center mt-2">
              {isPositive ? (
                <span className="text-green-600 text-xs font-medium flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {Math.abs(change).toFixed(1)}%
                </span>
              ) : isNegative ? (
                <span className="text-red-600 text-xs font-medium flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {Math.abs(change).toFixed(1)}%
                </span>
              ) : (
                <span className="text-gray-500 text-xs font-medium">No change</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "";
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    activeTables: 0,
    menuItems: 0,
  });
  const [trends, setTrends] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const refreshIntervalRef = useRef(null);
  const lastOrderCountRef = useRef(0);

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [ordersRes, tablesRes, menuRes, analyticsRes, trendsRes, recentOrdersRes, lowStockRes] = await Promise.all([
        API.get("/orders").catch(() => ({ data: [] })),
        API.get("/tables").catch(() => ({ data: [] })),
        API.get("/menu").catch(() => ({ data: [] })),
        API.get(`/analytics/sales-summary?period=${selectedPeriod}`).catch(() => ({ data: {} })),
        API.get("/analytics/sales-trends").catch(() => ({ data: null })),
        API.get("/analytics/recent-orders?limit=5").catch(() => ({ data: [] })),
        API.get("/analytics/low-stock").catch(() => ({ data: [] })),
      ]);

      const currentOrderCount = ordersRes.data.length;
      
      // Check for new orders and show notification
      if (lastOrderCountRef.current > 0 && currentOrderCount > lastOrderCountRef.current) {
        const newOrders = currentOrderCount - lastOrderCountRef.current;
        toast.success(`${newOrders} new order${newOrders > 1 ? 's' : ''} received!`, {
          icon: '🔔',
        });
      }
      lastOrderCountRef.current = currentOrderCount;

      // Check for low stock alerts
      if (lowStockRes.data.length > 0) {
        const lowStockCount = lowStockRes.data.length;
        if (lowStockCount > 0) {
          toast.error(`${lowStockCount} item${lowStockCount > 1 ? 's' : ''} running low on stock!`, {
            icon: '⚠️',
            duration: 5000,
          });
        }
      }

      setStats({
        totalOrders: analyticsRes.data.totalOrders || 0,
        totalSales: analyticsRes.data.totalSales || 0,
        activeTables: tablesRes.data.filter((t) => t.occupied).length || 0,
        menuItems: menuRes.data.length || 0,
      });

      setTrends(trendsRes.data);
      setRecentOrders(recentOrdersRes.data || []);
      setLowStockItems(lowStockRes.data || []);
      setRetryCount(0);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    loadDashboardData();
  };

  // Real-time updates via WebSocket
  useEffect(() => {
    connectSocket(
      (orderUpdate) => {
        // Refresh dashboard when order updates come through
        loadDashboardData(false);
      },
      (error) => {
        console.error("WebSocket error:", error);
      }
    );

    return () => {
      disconnectSocket();
    };
  }, [loadDashboardData]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      loadDashboardData(false);
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadDashboardData]);

  // Reload when period changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const getCurrentPeriodData = () => {
    if (!trends) return null;
    
    switch (selectedPeriod) {
      case "today":
        return trends.today;
      case "week":
        return trends.week;
      case "month":
        return trends.month;
      default:
        return null;
    }
  };

  const periodData = getCurrentPeriodData();
  const chartData = recentOrders.slice(0, 7).reverse().map((order, index) => ({
    name: `Order ${index + 1}`,
    amount: order.totalAmount,
    date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const allQuickActions = [
    { path: "/menu", label: "Menu Management", description: "Manage menu items", icon: "🍽️", permission: "canManageMenu" },
    { path: "/tables", label: "Tables", description: "View table status", icon: "🪑", permission: "canManageTables" },
    { path: "/orders", label: "Orders", description: "Create new orders", icon: "📋", permission: "canCreateOrders" },
    { path: "/kitchen", label: "Kitchen", description: "Kitchen display", icon: "👨‍🍳", permission: "canViewKitchen" },
    { path: "/analytics", label: "Analytics", description: "View reports", icon: "📊", permission: "canViewAnalytics" },
    { path: "/billing", label: "Billing", description: "Generate bills", icon: "🧾", permission: "canViewBills" },
    { path: "/inventory", label: "Inventory", description: "Manage inventory", icon: "📦", permission: "canManageInventory" },
  ];

  // Filter quick actions based on role permissions
  const quickActions = allQuickActions.filter(action => {
    if (!action.permission) return true;
    return can(userRole, action.permission);
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of your restaurant operations</p>
          </div>
          {error && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Retry ({retryCount})
            </button>
          )}
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Period:</span>
          {["today", "week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Cards with Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            change={periodData?.ordersChange}
            isLoading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          <StatCard
            title="Total Sales"
            value={`₹${stats.totalSales.toFixed(2)}`}
            change={periodData?.salesChange}
            isLoading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="Active Tables"
            value={stats.activeTables}
            change={null}
            isLoading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            title="Menu Items"
            value={stats.menuItems}
            change={null}
            isLoading={isLoading}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
        </div>

        {/* Charts and Recent Orders Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading chart...</div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
              <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Table {order.table?.tableNumber || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        order.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                        order.status === "CREATED" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No recent orders
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts - Only show for ADMIN */}
        {can(userRole, "canManageInventory") && lowStockItems.length > 0 && (
          <div className="card border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h2 className="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
              </div>
              <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage Inventory
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Stock: {item.quantity.toFixed(2)} {item.unit || ""} (Threshold: {item.threshold.toFixed(2)})
                  </p>
                </div>
              ))}
            </div>
            {lowStockItems.length > 6 && (
              <p className="text-sm text-gray-500 mt-3">
                +{lowStockItems.length - 6} more items with low stock
              </p>
            )}
          </div>
        )}

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
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{action.icon}</span>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1 group-hover:text-gray-900">{action.label}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
