import { useEffect, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

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
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Kitchen Orders</h2>
        <div className="grid grid-cols-3 gap-4">
          {orders.map((o) => (
            <div key={o.id} className="border p-4 mb-2 bg-white rounded shadow">
              <p className="text-sm text-gray-500 mb-1">Order ID</p>
              <p className="font-mono text-xs mb-3">{o.id}</p>
              <p className="mb-2">
                <b>Status:</b>{" "}
                <span className={`px-2 py-1 rounded ${getStatusColor(o.status)}`}>
                  {o.status}
                </span>
              </p>
              <p className="mb-2">
                <b>Total:</b> ₹{o.totalAmount?.toFixed(2) || "0.00"}
              </p>
              {o.items && o.items.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold mb-1">Items:</p>
                  <ul className="text-sm">
                    {o.items.map((item, idx) => (
                      <li key={idx}>
                        {item.menuItem?.name || "Unknown"} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {o.status === "CREATED" && (
                  <button
                    onClick={() => update(o.id, "IN_PROGRESS")}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Start
                  </button>
                )}
                {o.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => update(o.id, "COMPLETED")}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Done
                  </button>
                )}
                {o.status === "COMPLETED" && (
                  <span className="text-green-600 font-semibold">✓ Completed</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
        {orders.length === 0 && (
          <p className="text-gray-500 mt-4">No orders in kitchen</p>
        )}
      </div>
    </div>
  );
}

