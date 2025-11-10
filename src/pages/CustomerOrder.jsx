import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";

export default function CustomerOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get("tableId");
  
  const [menu, setMenu] = useState([]);
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [existingOrderItems, setExistingOrderItems] = useState([]); // Store existing order items separately
  const [existingOrder, setExistingOrder] = useState(null);
  const [hasCompletedOrders, setHasCompletedOrders] = useState(false);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (!tableId) {
      toast.error("Table ID is required");
      return;
    }
    loadTableInfo();
    loadMenu();
    
    // Poll for table status changes (e.g., when bill is generated)
    // Use silent mode to avoid toast spam during polling
    const pollInterval = setInterval(() => {
      loadTableInfo(true); // silent = true to avoid toast on polling
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [tableId]);

  const loadTableInfo = async (silent = false) => {
    try {
      const res = await API.get(`/customer/table/${tableId}`);
      const previousHasCompletedOrders = hasCompletedOrders;
      const previousExistingOrder = existingOrder;
      
      setTable(res.data);
      
      // If there's an existing active order, store it but keep cart empty for new items
      if (res.data.activeOrder) {
        setExistingOrder(res.data.activeOrder);
        setOrderId(res.data.activeOrder.orderId);
        
        // Store existing order items separately (for display only)
        const existingItems = res.data.activeOrder.items.map(item => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity
        }));
        setExistingOrderItems(existingItems);
        // Don't add existing items to cart - cart is only for new items to add
        setCart([]);
        setHasCompletedOrders(false);
        setCompletedOrdersCount(0);
      } else {
        setExistingOrderItems([]);
        setExistingOrder(null);
        // Check if there are completed orders
        if (res.data.hasCompletedOrders) {
          setHasCompletedOrders(true);
          setCompletedOrdersCount(res.data.completedOrdersCount || 0);
        } else {
          // If bills were generated (completed orders disappeared), refresh the page state
          if (previousHasCompletedOrders && !res.data.hasCompletedOrders && !silent) {
            // Bill was generated - reset everything for new customer
            setCart([]);
            setExistingOrderItems([]);
            setOrderId(null);
            setOrderPlaced(false);
            toast.success("Table is now available for new orders!");
          }
          setHasCompletedOrders(false);
          setCompletedOrdersCount(0);
        }
      }
    } catch (err) {
      if (!silent) {
        toast.error("Table not found");
      }
      console.error("Table load error:", err);
    }
  };

  const loadMenu = async () => {
    try {
      const res = await API.get("/customer/menu");
      setMenu(res.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load menu");
      console.error("Menu load error:", err);
      setLoading(false);
    }
  };

  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menuItemId === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }]);
    }
    toast.success(`${menuItem.name} added to cart`);
  };

  const updateQuantity = (menuItemId, change) => {
    setCart(cart.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tableId: tableId,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      };

      const res = await API.post("/customer/order", payload);
      setOrderId(res.data.orderId);
      
      // If it's a new order, show success message and reset
      if (res.data.isNewOrder) {
        setOrderPlaced(true);
        setCart([]);
        setExistingOrder(null);
        toast.success(res.data.message || "Order placed successfully!");
      } else {
        // Items added to existing order - reload table info to get updated order
        setCart([]);
        toast.success(res.data.message || "Items added to existing order!");
        // Reload table info to get updated order with all items
        await loadTableInfo();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to place order";
      toast.error(errorMsg);
      
      // If there are unbilled orders, reload table info to show the correct state
      if (err.response?.data?.hasUnbilledOrders) {
        await loadTableInfo();
      }
      
      console.error("Order error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">Your order has been received and will be prepared shortly.</p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">Order ID: {orderId.substring(0, 8)}...</p>
          )}
          <button
            onClick={() => {
              setOrderPlaced(false);
              setOrderId(null);
              setCart([]);
              loadTableInfo();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add More Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">RestroSuite</h1>
          {table && (
            <p className="text-gray-600">Table {table.tableNumber} {table.location && `- ${table.location}`}</p>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-bold text-blue-600">₹{item.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                {existingOrder && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Active Order
                  </span>
                )}
              </div>
              {existingOrder && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Order Status:</strong> {existingOrder.status}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Current Total: ₹{existingOrder.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
              )}
              
              {hasCompletedOrders && !existingOrder && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Previous Order Completed!</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    You can now place a new order. All orders will be combined in your final bill.
                  </p>
                  {completedOrdersCount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      You have {completedOrdersCount} completed order{completedOrdersCount > 1 ? 's' : ''} for this table.
                    </p>
                  )}
                </div>
              )}
              
              {/* Show existing order items */}
              {existingOrderItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Order Items:</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {existingOrderItems.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">{item.name} × {item.quantity}</span>
                        <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show new items being added */}
              {cart.length === 0 && existingOrderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Add items below to add to your order</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItemId)}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="space-y-2 mb-4">
                      {existingOrder && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Current Order Total:</span>
                          <span>₹{existingOrder.totalAmount?.toFixed(2) || "0.00"}</span>
                        </div>
                      )}
                      {cart.length > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>New Items Total:</span>
                          <span>₹{getTotal().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{((existingOrder?.totalAmount || 0) + getTotal()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {submitting 
                        ? (existingOrder ? "Adding Items..." : "Placing Order...") 
                        : (existingOrder ? "Add to Order" : "Place Order")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

