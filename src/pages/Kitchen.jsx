import { useEffect, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    // Initial load
    load();

    // Connect to WebSocket for real-time updates
    connectSocket(
      (orderUpdate) => {
        // Update existing order or add new one
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o.id === orderUpdate.id);
          if (existingIndex >= 0) {
            // Update existing order
            const updated = [...prev];
            updated[existingIndex] = orderUpdate;
            return updated;
          } else {
            // Add new order
            return [...prev, orderUpdate];
          }
        });
      },
      (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection lost. Reconnecting...");
      }
    );

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const update = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status?status=${status}`);
      toast.success(`Order status updated to ${status}`);
      // WebSocket will handle the UI update automatically
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED":
        return "bg-gray-100 text-gray-700";
      case "IN_PROGRESS":
        return "bg-gray-100 text-gray-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const pendingOrders = orders.filter((o) => o.status !== "COMPLETED");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Kitchen Display</h1>
          <p className="text-sm text-gray-500">Manage and track order preparation</p>
        </div>

        {pendingOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4 text-gray-900">
              Active Orders ({pendingOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingOrders.map((o) => (
                <div key={o.id} className="card border-l-2 border-gray-900">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-xs font-medium text-gray-700">{o.id}</p>
                    </div>
                    <span className={`badge ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>

                  {o.items && o.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Items:</p>
                      <ul className="space-y-1">
                        {o.items.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                            {item.menuItem?.name || "Unknown"} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="font-semibold text-gray-900">₹{o.totalAmount?.toFixed(2) || "0.00"}</span>
                  </div>

                  <div className="flex gap-2">
                    {o.status === "CREATED" && (
                      <button
                        onClick={() => update(o.id, "IN_PROGRESS")}
                        className="btn-primary flex-1"
                      >
                        Start Cooking
                      </button>
                    )}
                    {o.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => update(o.id, "COMPLETED")}
                        className="btn-primary flex-1"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4 text-gray-900">
              Completed Orders ({completedOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedOrders.map((o) => (
                <div key={o.id} className="card border-l-2 border-gray-300 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-xs font-medium text-gray-700">{o.id}</p>
                    </div>
                    <span className="badge bg-gray-100 text-gray-700">Completed</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Total: <span className="font-semibold text-gray-900">₹{o.totalAmount?.toFixed(2) || "0.00"}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-sm">No orders in kitchen</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

