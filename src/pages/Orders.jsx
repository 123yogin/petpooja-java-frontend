import { useEffect, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Orders() {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

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

  const loadOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    loadMenu();
    loadTables();
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
        items: cart.map((c) => ({ menuItemId: c.id, quantity: c.qty })),
      };
      await API.post("/orders/create", payload);
      toast.success("Order Created!");
      setCart([]);
      setTableId("");
      // WebSocket will handle the UI update automatically
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
                <select
                  className="input-field"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                >
                  <option value="">-- Select a Table --</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.tableNumber} {table.occupied ? "(Occupied)" : "(Available)"}
                    </option>
                  ))}
                </select>
                {tables.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No tables available. Please create tables first.</p>
                )}
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

        {/* Existing Orders */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Orders ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No orders yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map((o) => (
                <div key={o.id} className="border border-gray-100 p-4 rounded-lg hover:border-gray-300 transition-all bg-white">
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="font-mono text-xs mb-3 text-gray-700">{o.id}</p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Status:</span>{" "}
                      <span className="badge bg-gray-100 text-gray-700">{o.status}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold text-gray-900">₹{o.totalAmount?.toFixed(2) || "0.00"}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

