import { useEffect, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [orderTimers, setOrderTimers] = useState({}); // Track time for each order
  const [statusFilter, setStatusFilter] = useState("active"); // active, all
  const [isFullScreen, setIsFullScreen] = useState(false);

  const load = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
    } catch (err) {
      const errorMessage = err.response?.status === 403 
        ? "You don't have permission to view orders"
        : err.message || "Failed to load orders";
      toast.error(errorMessage);
      console.error("Kitchen load error:", err);
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
            // Add new order - start timer
            if (orderUpdate.status !== "COMPLETED" && orderUpdate.createdAt) {
              setOrderTimers((prev) => ({
                ...prev,
                [orderUpdate.id]: new Date(orderUpdate.createdAt),
              }));
            }
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

  // Initialize timers when orders are loaded
  useEffect(() => {
    setOrderTimers((prev) => {
      const timers = { ...prev };
      orders.forEach((order) => {
        if (order.status !== "COMPLETED" && order.createdAt && !timers[order.id]) {
          timers[order.id] = new Date(order.createdAt);
        }
      });
      return timers;
    });
  }, [orders]);

  // Separate effect for timer updates
  useEffect(() => {
    // Update timers every second
    const interval = setInterval(() => {
      setOrderTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((orderId) => {
          const order = orders.find((o) => o.id === orderId);
          if (order && order.status === "COMPLETED") {
            delete updated[orderId];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

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
        return "bg-gray-100 text-gray-700";
    }
  };

  const getElapsedTime = (orderId) => {
    if (!orderTimers[orderId]) return "0:00";
    const startTime = orderTimers[orderId];
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000); // seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getFilteredOrders = () => {
    if (statusFilter === "active") {
      return orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
    }
    return orders;
  };

  const pendingOrders = getFilteredOrders().filter((o) => o.status !== "COMPLETED");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  // Priority orders (older than 15 minutes)
  const getPriorityOrders = () => {
    return pendingOrders.filter((order) => {
      if (!orderTimers[order.id]) return false;
      const elapsed = (new Date() - orderTimers[order.id]) / 1000 / 60; // minutes
      return elapsed > 15;
    });
  };

  const priorityOrders = getPriorityOrders();

  const printKitchenTicket = (order) => {
    const printWindow = window.open("", "_blank");
    const content = `
      <html>
        <head>
          <title>Kitchen Ticket - Order ${order.id.substring(0, 8)}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h2 { margin: 0 0 10px 0; }
            .info { margin: 5px 0; }
            .items { margin-top: 15px; }
            .item { padding: 5px 0; border-bottom: 1px dashed #ccc; }
          </style>
        </head>
        <body>
          <h2>Kitchen Ticket</h2>
          <div class="info"><strong>Order ID:</strong> ${order.id}</div>
          <div class="info"><strong>Table:</strong> ${order.table?.tableNumber || "N/A"}</div>
          <div class="info"><strong>Time:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          <div class="items">
            <h3>Items:</h3>
            ${order.items?.map((item) => `
              <div class="item">
                ${item.menuItem?.name || "Unknown"} × ${item.quantity}
              </div>
            `).join("") || "No items"}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Kitchen Display</h1>
          <p className="text-sm text-gray-500">Manage and track order preparation</p>
        </div>
          <div className="flex gap-2">
            <select
              className="input-field text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Active Orders</option>
              <option value="all">All Orders</option>
            </select>
            <button
              onClick={toggleFullScreen}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>

        {/* Priority Orders Alert */}
        {priorityOrders.length > 0 && (
          <div className="card border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h2 className="text-lg font-medium text-red-900">
                  Priority Orders ({priorityOrders.length}) - Over 15 minutes
                </h2>
              </div>
            </div>
          </div>
        )}

        {pendingOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4 text-gray-900">
              Active Orders ({pendingOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingOrders.map((o) => {
                const isPriority = priorityOrders.some((po) => po.id === o.id);
                return (
                <div key={o.id} className={`card border-l-2 ${isPriority ? "border-red-500 bg-red-50" : "border-gray-900"}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-xs font-medium text-gray-700">{o.id.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Table: {o.table?.tableNumber || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                    <span className={`badge ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                      {orderTimers[o.id] && (
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          {getElapsedTime(o.id)}
                        </p>
                      )}
                    </div>
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
                    <button
                      onClick={() => printKitchenTicket(o)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      title="Print Kitchen Ticket"
                    >
                      🖨️
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              );
              })}
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

