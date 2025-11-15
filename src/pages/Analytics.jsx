import { useEffect, useState } from "react";
import API from "../api/axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [orders, setOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [profitLoss, setProfitLoss] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [reportDateRange, setReportDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const url = selectedPeriod !== "custom" 
          ? `/analytics/sales-summary${selectedPeriod !== "all" ? `?period=${selectedPeriod}` : ""}`
          : `/analytics/sales-summary`;
        const [summaryRes, ordersRes, trendsRes, recentOrdersRes, lowStockRes, plRes, cfRes] = await Promise.all([
          API.get(url),
          API.get("/orders"),
          API.get("/analytics/sales-trends").catch(() => ({ data: null })),
          API.get("/analytics/recent-orders?limit=10").catch(() => ({ data: [] })),
          API.get("/analytics/low-stock").catch(() => ({ data: [] })),
          API.get(`/analytics/profit-loss?startDate=${reportDateRange.start}&endDate=${reportDateRange.end}`).catch(() => ({ data: null })),
          API.get(`/analytics/cash-flow?startDate=${reportDateRange.start}&endDate=${reportDateRange.end}`).catch(() => ({ data: null })),
        ]);
        setData(summaryRes.data);
        setTrends(trendsRes.data);
        setRecentOrders(recentOrdersRes.data || []);
        setLowStockItems(lowStockRes.data || []);
        setProfitLoss(plRes.data);
        setCashFlow(cfRes.data);
        
        // Filter orders by date range if custom
        let filteredOrders = ordersRes.data;
        if (selectedPeriod === "custom" && dateRange.start && dateRange.end) {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          filteredOrders = ordersRes.data.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
          });
        } else if (selectedPeriod !== "all" && selectedPeriod !== "custom") {
          const now = new Date();
          let startDate = new Date();
          switch (selectedPeriod) {
            case "today":
              startDate.setHours(0, 0, 0, 0);
              break;
            case "week":
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
              break;
            case "month":
              startDate.setMonth(now.getMonth() - 1);
              startDate.setHours(0, 0, 0, 0);
              break;
            case "year":
              startDate.setFullYear(now.getFullYear() - 1);
              startDate.setHours(0, 0, 0, 0);
              break;
          }
          filteredOrders = ordersRes.data.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate;
          });
        }
        setOrders(filteredOrders);
      } catch (err) {
        const errorMessage = err.response?.status === 403 
          ? "You don't have permission to view analytics"
          : err.message || "Failed to load analytics";
        toast.error(errorMessage);
        console.error("Analytics load error:", err);
      }
    };
    loadData();
  }, [selectedPeriod, dateRange.start, dateRange.end, reportDateRange.start, reportDateRange.end]);

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  const chartData = [
    { name: "Total Sales", value: data.totalSales || 0 },
    { name: "Total Orders", value: data.totalOrders || 0 },
  ];

  const colors = ["#0088FE", "#00C49F"];

  // Prepare data for bar chart (orders by status)
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">View sales reports and insights</p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="card">
          <h2 className="text-base font-medium text-gray-900 mb-4">Filter by Period</h2>
          <div className="flex flex-wrap items-center gap-3">
            {["all", "today", "week", "month", "year", "custom"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
            {selectedPeriod === "custom" && (
              <div className="flex items-center gap-2 ml-4">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input-field"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sales Trends Cards */}
        {trends && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">Today's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{trends.today?.sales?.toFixed(2) || "0.00"}
              </p>
              {trends.today?.salesChange !== undefined && (
                <p className={`text-xs mt-1 ${trends.today.salesChange >= 0 ? "text-black" : "text-gray-600"}`}>
                  {trends.today.salesChange >= 0 ? "↑" : "↓"} {Math.abs(trends.today.salesChange).toFixed(1)}% vs yesterday
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">This Week's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{trends.week?.sales?.toFixed(2) || "0.00"}
              </p>
              {trends.week?.salesChange !== undefined && (
                <p className={`text-xs mt-1 ${trends.week.salesChange >= 0 ? "text-black" : "text-gray-600"}`}>
                  {trends.week.salesChange >= 0 ? "↑" : "↓"} {Math.abs(trends.week.salesChange).toFixed(1)}% vs last week
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">This Month's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{trends.month?.sales?.toFixed(2) || "0.00"}
              </p>
              {trends.month?.salesChange !== undefined && (
                <p className={`text-xs mt-1 ${trends.month.salesChange >= 0 ? "text-black" : "text-gray-600"}`}>
                  {trends.month.salesChange >= 0 ? "↑" : "↓"} {Math.abs(trends.month.salesChange).toFixed(1)}% vs last month
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-semibold text-gray-900">
              ₹{data.totalSales?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Orders</p>
            <p className="text-2xl font-semibold text-gray-900">
              {data.totalOrders || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 font-medium mb-1">Avg Order Value</p>
            <p className="text-2xl font-semibold text-gray-900">
              ₹{data.avgOrderValue?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-medium mb-4 text-gray-900">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-base font-medium mb-4 text-gray-900">Orders by Status</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1f2937" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-sm">No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Trends Line Chart */}
        {trends && (
          <div className="card">
            <h3 className="text-base font-medium mb-4 text-gray-900">Sales Trends Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={[
                  { period: "Today", sales: trends.today?.sales || 0, orders: trends.today?.orders || 0 },
                  { period: "This Week", sales: trends.week?.sales || 0, orders: trends.week?.orders || 0 },
                  { period: "This Month", sales: trends.month?.sales || 0, orders: trends.month?.orders || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Sales (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="card">
            <h3 className="text-base font-medium mb-4 text-gray-900">Recent Orders</h3>
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Table {order.table?.tableNumber || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{order.totalAmount?.toFixed(2) || "0.00"}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                      order.status === "IN_PROGRESS" ? "bg-gray-200 text-gray-900" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Reports */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Reports</h2>
          <div className="mb-4 flex items-center gap-3">
            <input
              type="date"
              value={reportDateRange.start}
              onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })}
              className="input-field"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={reportDateRange.end}
              onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit & Loss */}
            {profitLoss && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">Profit & Loss</h3>
                  <button
                    onClick={() => {
                      const csv = `Profit & Loss Report\nPeriod: ${profitLoss.startDate} to ${profitLoss.endDate}\n\nRevenue,${profitLoss.revenue}\nExpenses,${profitLoss.expenses}\nPurchase Expenses,${profitLoss.purchaseExpenses}\nPayroll Expenses,${profitLoss.payrollExpenses}\nNet Profit,${profitLoss.netProfit}\nProfit Margin,${profitLoss.profitMargin}%\n`;
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `profit-loss-${profitLoss.startDate}-${profitLoss.endDate}.csv`;
                      a.click();
                    }}
                    className="btn-outline btn-sm"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="text-sm font-semibold text-black">₹{profitLoss.revenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Expenses:</span>
                    <span className="text-sm font-semibold text-gray-600">₹{profitLoss.expenses?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-xs text-gray-500">Purchase Expenses:</span>
                    <span className="text-xs text-gray-700">₹{profitLoss.purchaseExpenses?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-xs text-gray-500">Payroll Expenses:</span>
                    <span className="text-xs text-gray-700">₹{profitLoss.payrollExpenses?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Net Profit:</span>
                      <span className={`text-sm font-semibold ${profitLoss.netProfit >= 0 ? "text-black" : "text-gray-600"}`}>
                        ₹{profitLoss.netProfit?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Profit Margin:</span>
                      <span className={`text-xs font-medium ${profitLoss.profitMargin >= 0 ? "text-black" : "text-gray-600"}`}>
                        {profitLoss.profitMargin?.toFixed(2) || "0.00"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Flow */}
            {cashFlow && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">Cash Flow</h3>
                  <button
                    onClick={() => {
                      const csv = `Cash Flow Report\nPeriod: ${cashFlow.startDate} to ${cashFlow.endDate}\n\nCash Inflows,${cashFlow.cashInflows}\nCash Outflows,${cashFlow.cashOutflows}\nPurchase Outflows,${cashFlow.purchaseOutflows}\nPayroll Outflows,${cashFlow.payrollOutflows}\nNet Cash Flow,${cashFlow.netCashFlow}\n`;
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `cash-flow-${cashFlow.startDate}-${cashFlow.endDate}.csv`;
                      a.click();
                    }}
                    className="btn-outline btn-sm"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash Inflows:</span>
                    <span className="text-sm font-semibold text-black">₹{cashFlow.cashInflows?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash Outflows:</span>
                    <span className="text-sm font-semibold text-gray-600">₹{cashFlow.cashOutflows?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-xs text-gray-500">Purchase Outflows:</span>
                    <span className="text-xs text-gray-700">₹{cashFlow.purchaseOutflows?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-xs text-gray-500">Payroll Outflows:</span>
                    <span className="text-xs text-gray-700">₹{cashFlow.payrollOutflows?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Net Cash Flow:</span>
                      <span className={`text-sm font-semibold ${cashFlow.netCashFlow >= 0 ? "text-black" : "text-gray-600"}`}>
                        ₹{cashFlow.netCashFlow?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="card border-l-4 border-gray-900">
            <h3 className="text-base font-medium mb-4 text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Low Stock Alerts ({lowStockItems.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Stock: {item.quantity?.toFixed(2) || 0} {item.unit || ""} (Threshold: {item.threshold?.toFixed(2) || 0})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

