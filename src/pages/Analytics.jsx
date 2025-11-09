import { useEffect, useState } from "react";
import API from "../api/axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

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
      <div>
        <Navbar />
        <div className="p-6">
          <p>Loading...</p>
        </div>
      </div>
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
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Analytics Dashboard</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Total Sales</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{data.totalSales?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.totalOrders || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Avg Order Value</p>
            <p className="text-2xl font-bold text-purple-600">
              ₹{data.avgOrderValue?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Sales Overview</h3>
            <PieChart width={300} height={250}>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Orders by Status</h3>
            {statusData.length > 0 ? (
              <BarChart width={300} height={250} data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            ) : (
              <p className="text-gray-500">No order data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

