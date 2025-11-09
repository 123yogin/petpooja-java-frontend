import { useEffect, useState } from "react";
import API from "../api/axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          API.get("/analytics/sales-summary"),
          API.get("/orders"),
        ]);
        setData(summaryRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        toast.error("Failed to load analytics");
      }
    };
    loadData();
  }, []);

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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">View sales reports and insights</p>
        </div>

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
      </div>
    </Layout>
  );
}

