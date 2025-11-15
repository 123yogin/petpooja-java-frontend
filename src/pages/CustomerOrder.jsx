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
  const [completedOrder, setCompletedOrder] = useState(null); // Store completed order for bill generation
  const [hasCompletedOrders, setHasCompletedOrders] = useState(false);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [bill, setBill] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);

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
        setCompletedOrder(null); // Clear completed order if active order exists
        
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
      } else if (res.data.completedOrder) {
        // There's a completed order (no active order)
        setExistingOrder(null);
        setCompletedOrder(res.data.completedOrder);
        setOrderId(res.data.completedOrder.orderId);
        
        // Store completed order items for display
        const completedItems = res.data.completedOrder.items.map(item => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity
        }));
        setExistingOrderItems(completedItems);
        setCart([]);
        
        // Check if there are other completed orders
        if (res.data.hasCompletedOrders) {
          setHasCompletedOrders(true);
          setCompletedOrdersCount(res.data.completedOrdersCount || 0);
        } else {
          setHasCompletedOrders(false);
          setCompletedOrdersCount(0);
        }
      } else {
        setExistingOrderItems([]);
        setExistingOrder(null);
        setCompletedOrder(null);
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

  const generateBill = async () => {
    // Use orderId from either existingOrder or completedOrder
    const currentOrderId = orderId || (completedOrder?.orderId) || (existingOrder?.orderId);
    if (!currentOrderId) {
      toast.error("No order found");
      return;
    }
    
    setGeneratingBill(true);
    try {
      const res = await API.post(`/customer/order/${currentOrderId}/generate-bill?tableId=${tableId}`);
      setBill(res.data);
      setShowBill(true);
      toast.success("Bill generated successfully!");
      // Reload table info - this will clear previous orders since bill is generated
      await loadTableInfo();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to generate bill";
      toast.error(errorMsg);
      console.error("Bill generation error:", err);
    } finally {
      setGeneratingBill(false);
    }
  };

  const downloadBill = async (billId) => {
    try {
      const res = await API.get(`/customer/bill/${billId}/download?tableId=${tableId}`, {
        responseType: "blob",
      });
      
      if (res.data instanceof Blob) {
        const url = window.URL.createObjectURL(res.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `bill-${billId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Bill downloaded!");
      }
    } catch (err) {
      toast.error("Failed to download bill");
      console.error("Download error:", err);
    }
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
      
      // Clear cart and show success message
      setCart([]);
      toast.success(res.data.message || "Order placed successfully!");
      
      // Reload table info to get updated order with all items
      await loadTableInfo();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
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
                    <span className="text-lg font-bold text-black">₹{item.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm"
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
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    Active Order
                  </span>
                )}
              </div>
              {existingOrder && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800">
                    <strong>Order Status:</strong> {existingOrder.status}
                  </p>
                  <p className="text-xs text-black mt-1">
                    Current Total: ₹{existingOrder.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                  {existingOrder.status === "COMPLETED" && (
                    <button
                      onClick={generateBill}
                      disabled={generatingBill}
                      className="mt-2 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {generatingBill ? "Generating Bill..." : "Generate Bill"}
                    </button>
                  )}
                  {existingOrder.status !== "COMPLETED" && (
                    <p className="mt-2 text-xs text-gray-600">
                      Please wait for your order to be completed before generating the bill.
                    </p>
                  )}
                </div>
              )}
              
              {completedOrder && !existingOrder && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-800">
                    <strong>Order Completed!</strong>
                  </p>
                  <p className="text-xs text-black mt-1">
                    Total: ₹{completedOrder.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                  {!completedOrder.hasBill && (
                    <button
                      onClick={generateBill}
                      disabled={generatingBill}
                      className="mt-2 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {generatingBill ? "Generating Bill..." : "Generate Bill"}
                    </button>
                  )}
                  {completedOrder.hasBill && (
                    <p className="mt-2 text-xs text-gray-900">
                      Bill already generated for this order.
                    </p>
                  )}
                  {hasCompletedOrders && completedOrdersCount > 0 && (
                    <p className="text-xs text-black mt-2">
                      You have {completedOrdersCount} more completed order{completedOrdersCount > 1 ? 's' : ''} for this table.
                    </p>
                  )}
                </div>
              )}
              
              {hasCompletedOrders && !existingOrder && !completedOrder && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-800">
                    <strong>Previous Order Completed!</strong>
                  </p>
                  <p className="text-xs text-black mt-1">
                    You can now place a new order. All orders will be combined in your final bill.
                  </p>
                  {completedOrdersCount > 0 && (
                    <p className="text-xs text-black mt-1">
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
                            className="ml-2 text-gray-700 hover:text-gray-900"
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
                        <span className="text-xl font-bold text-black">
                          ₹{((existingOrder?.totalAmount || 0) + getTotal()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
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

      {/* Bill Display Modal */}
      {showBill && bill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Bill</h2>
                <button
                  onClick={() => {
                    setShowBill(false);
                    setBill(null);
                  }}
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
                    <p className="text-sm text-gray-500 mb-1">Bill ID</p>
                    <p className="font-mono text-sm text-gray-900">{bill.billId.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="font-mono text-sm text-gray-900">{bill.orderId.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Table</p>
                    <p className="text-sm font-medium text-gray-900">
                      {table?.tableNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {bill.generatedAt ? new Date(bill.generatedAt).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                {bill.items && bill.items.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordered Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-2 font-medium text-gray-700">Item</th>
                            <th className="text-left p-2 font-medium text-gray-700">HSN</th>
                            <th className="text-right p-2 font-medium text-gray-700">Qty</th>
                            <th className="text-right p-2 font-medium text-gray-700">Rate</th>
                            <th className="text-right p-2 font-medium text-gray-700">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item, index) => (
                            <tr key={item.menuItemId || index} className="border-b border-gray-100">
                              <td className="p-2 text-gray-900">{item.name}</td>
                              <td className="p-2 text-gray-600">{item.hsnCode || "N/A"}</td>
                              <td className="p-2 text-right text-gray-900">{item.quantity}</td>
                              <td className="p-2 text-right text-gray-900">₹{item.unitPrice?.toFixed(2) || "0.00"}</td>
                              <td className="p-2 text-right font-medium text-gray-900">₹{item.price?.toFixed(2) || "0.00"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>₹{bill.totalAmount?.toFixed(2) || "0.00"}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Discount:</span>
                        <span>-₹{bill.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.isInterState ? (
                      bill.igst > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>IGST:</span>
                          <span>₹{bill.igst.toFixed(2)}</span>
                        </div>
                      )
                    ) : (
                      <>
                        {bill.cgst > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>CGST:</span>
                            <span>₹{bill.cgst.toFixed(2)}</span>
                          </div>
                        )}
                        {bill.sgst > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>SGST:</span>
                            <span>₹{bill.sgst.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                      <span>Total Tax:</span>
                      <span>₹{bill.tax?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                      <span className="text-2xl font-bold text-black">₹{bill.grandTotal?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => downloadBill(bill.billId)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowBill(false);
                      setBill(null);
                    }}
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
  );
}

