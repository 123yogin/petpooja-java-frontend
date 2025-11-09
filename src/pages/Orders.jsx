import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { can } from "../utils/rolePermissions";

export default function Orders() {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "";
  const [searchParams] = useSearchParams();
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadMenu = async () => {
    try {
      const res = await API.get("/menu");
      setMenu(res.data);
    } catch (err) {
      toast.error("Failed to load menu");
    }
  };

  const loadTables = async () => {
    try {
      const res = await API.get("/tables");
      setTables(res.data);
    } catch (err) {
      toast.error("Failed to load tables");
    }
  };

  const loadOutlets = async () => {
    try {
      const res = await API.get("/outlets/active");
      setOutlets(res.data);
      if (res.data.length > 0 && !selectedOutlet) {
        setSelectedOutlet(res.data[0].id); // Auto-select first outlet
      }
    } catch (err) {
      // Outlets might not be available, continue without them
      console.log("Outlets not available");
    }
  };

  const loadOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
      setFilteredOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.id?.toLowerCase().includes(searchLower) ||
          o.table?.tableNumber?.toLowerCase().includes(searchLower) ||
          o.status?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Table filter
    if (tableFilter !== "all") {
      filtered = filtered.filter((o) => o.table?.id === tableFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, tableFilter, searchTerm]);

  // Handle URL parameter for table pre-selection
  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) {
      setTableId(tableParam);
      // Also set the table filter to show orders for this table
      setTableFilter(tableParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadMenu();
    loadTables();
    loadOutlets();
    loadOrders();

    // Connect to WebSocket for real-time order updates
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
      }
    );

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const addToCart = (m) => {
    const existing = cart.find((i) => i.id === m.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === m.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...m, qty: 1 }]);
    }
    toast.success(`${m.name} added to cart`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(
      cart.map((i) => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          if (newQty <= 0) return null;
          return { ...i, qty: newQty };
        }
        return i;
      }).filter(Boolean)
    );
  };

  const createOrder = async () => {
    if (!tableId || cart.length === 0) {
      toast.error("Please enter table ID and add items to cart");
      return;
    }
    try {
      const payload = {
        tableId,
        outletId: selectedOutlet || null,
        items: cart.map((c) => ({ menuItemId: c.id, quantity: c.qty })),
      };
      await API.post("/orders/create", payload);
      toast.success("Order Created!");
      setCart([]);
      setTableId("");
      loadOrders();
      // WebSocket will handle the UI update automatically
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status?status=${newStatus}`);
      toast.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Order Management</h1>
          <p className="text-sm text-gray-500">Create and manage orders</p>
        </div>

        {can(userRole, "canCreateOrders") ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Menu Items</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {menu.map((m) => (
                  <div key={m.id} className="border border-gray-100 p-4 rounded-lg hover:border-gray-300 transition-all bg-white">
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">{m.name}</h4>
                    <p className="text-base font-semibold text-gray-900 mb-1">₹{m.price}</p>
                    <p className="text-xs text-gray-500 mb-3">{m.category}</p>
                    <button
                      onClick={() => addToCart(m)}
                      disabled={!m.available}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        m.available
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {m.available ? "Add to Cart" : "Unavailable"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Order Summary */}
          <div className="space-y-6">
            <div className="card">
              <div className="mb-4 space-y-3">
                {outlets.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Outlet</label>
                    <select
                      className="input-field"
                      value={selectedOutlet}
                      onChange={(e) => setSelectedOutlet(e.target.value)}
                    >
                      {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.name} ({outlet.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
                  <select
                    className="input-field"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  >
                    <option value="">-- Select a Table --</option>
                    {tables
                      .filter((table) => !selectedOutlet || !table.outlet || table.outlet.id === selectedOutlet)
                      .map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.tableNumber} {table.occupied ? "(Occupied)" : "(Available)"}
                        </option>
                      ))}
                  </select>
                  {tables.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No tables available. Please create tables first.</p>
                  )}
                </div>
              </div>

              <h3 className="text-base font-medium text-gray-900 mb-4">Cart ({cart.length} items)</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {cart.map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">₹{c.price} × {c.qty} = ₹{c.price * c.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQty(c.id, -1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-medium text-sm">{c.qty}</span>
                          <button
                            onClick={() => updateCartQty(c.id, 1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-200 rounded text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(c.id)}
                            className="text-gray-400 hover:text-gray-900 text-sm font-medium ml-2 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-medium text-gray-700">Total:</span>
                      <span className="text-xl font-semibold text-gray-900">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={createOrder}
                      disabled={!tableId || cart.length === 0}
                      className="btn-primary w-full py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Submit Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              You can view orders but cannot create new orders. Contact an administrator if you need to create orders.
            </p>
          </div>
        )}

        {/* Existing Orders */}
        <div className="card">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Existing Orders ({filteredOrders.length} of {orders.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Search by order ID, table, or status..."
                className="input-field text-sm md:col-span-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="input-field text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="CREATED">Created</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                className="input-field text-sm"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
              >
                <option value="all">All Tables</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.tableNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No orders yet</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No orders match your filters</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOrders.map((o) => (
                <div key={o.id} className="border border-gray-100 p-4 rounded-lg hover:border-gray-300 transition-all bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-xs text-gray-700">{o.id.substring(0, 8)}...</p>
                    </div>
                    <span className={`badge ${
                      o.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      o.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                      o.status === "CREATED" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Table:</span>{" "}
                      <span className="font-medium text-gray-900">{o.table?.tableNumber || "N/A"}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold text-gray-900">₹{o.totalAmount?.toFixed(2) || "0.00"}</span>
                    </p>
                    {o.items && o.items.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {o.items.length} item{o.items.length > 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors min-w-[100px]"
                      >
                        View Details
                      </button>
                      {can(userRole, "canUpdateOrderStatus") && o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                        <button
                          onClick={() => {
                            const nextStatus = o.status === "CREATED" ? "IN_PROGRESS" : "COMPLETED";
                            updateOrderStatus(o.id, nextStatus);
                          }}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
                        >
                          {o.status === "CREATED" ? "Start" : "Complete"}
                        </button>
                      )}
                      {o.status === "COMPLETED" && can(userRole, "canGenerateBills") && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await API.post(`/billing/generate/${o.id}`);
                              toast.success("Bill generated successfully!");
                            } catch (err) {
                              toast.error(err.response?.data?.message || "Failed to generate bill");
                            }
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                          Bill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-sm text-gray-900">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`badge ${
                        selectedOrder.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        selectedOrder.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                        selectedOrder.status === "CREATED" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Table</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedOrder.table?.tableNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Created At</p>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3">Order Items</h3>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.menuItem?.name || "Unknown Item"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Quantity: {item.quantity} × ₹{item.menuItem?.price?.toFixed(2) || item.price?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{item.price?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-gray-700">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">
                        ₹{selectedOrder.totalAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {can(userRole, "canUpdateOrderStatus") && selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
                      <button
                        onClick={() => {
                          const nextStatus = selectedOrder.status === "CREATED" ? "IN_PROGRESS" : "COMPLETED";
                          updateOrderStatus(selectedOrder.id, nextStatus);
                          setSelectedOrder(null);
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                      >
                        {selectedOrder.status === "CREATED" ? "Start Order" : "Complete Order"}
                      </button>
                    )}
                    {selectedOrder.status === "COMPLETED" && can(userRole, "canGenerateBills") && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await API.post(`/billing/generate/${selectedOrder.id}`);
                            toast.success("Bill generated successfully!");
                            setSelectedOrder(null);
                          } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to generate bill");
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Generate Bill
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

