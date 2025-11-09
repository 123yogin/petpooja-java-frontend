import { useEffect, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

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
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Create Order</h2>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Select Table:</label>
          <select
            className="border p-2 mb-4 w-80 rounded"
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
            <p className="text-sm text-gray-500">No tables available. Please create tables first.</p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {menu.map((m) => (
            <div key={m.id} className="border p-3 rounded bg-white shadow">
              <h4 className="font-semibold">{m.name}</h4>
              <p className="text-gray-600">₹{m.price}</p>
              <p className="text-xs text-gray-500">{m.category}</p>
              <button
                onClick={() => addToCart(m)}
                disabled={!m.available}
                className="bg-green-600 text-white px-2 py-1 mt-1 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {m.available ? "Add" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>

        <div className="border p-4 rounded bg-gray-50 mb-6">
          <h3 className="font-bold mb-2">Cart ({cart.length} items)</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            <>
              {cart.map((c) => (
                <div key={c.id} className="flex justify-between items-center mb-2">
                  <span>
                    {c.name} × {c.qty} = ₹{c.price * c.qty}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCartQty(c.id, -1)}
                      className="bg-gray-300 px-2 rounded"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateCartQty(c.id, 1)}
                      className="bg-gray-300 px-2 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t">
                <p className="font-bold text-lg">Total: ₹{cartTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={createOrder}
                className="bg-blue-600 text-white px-4 py-2 mt-2 rounded hover:bg-blue-700"
              >
                Submit Order
              </button>
            </>
          )}
        </div>

        <h2 className="text-xl font-bold mt-6 mb-2">Existing Orders</h2>
        <div className="grid grid-cols-3 gap-4">
          {orders.map((o) => (
            <div key={o.id} className="border p-4 rounded bg-white shadow">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-xs mb-2">{o.id}</p>
              <p>
                <b>Status:</b> <span className="text-blue-600">{o.status}</span>
              </p>
              <p>
                <b>Total:</b> ₹{o.totalAmount?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
        {orders.length === 0 && (
          <p className="text-gray-500 mt-4">No orders yet</p>
        )}
      </div>
    </div>
  );
}

