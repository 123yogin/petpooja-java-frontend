import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { can } from "../utils/rolePermissions";

export default function Billing() {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "";
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderBillsMap, setOrderBillsMap] = useState({}); // Map orderId -> billId
  const [selectedBill, setSelectedBill] = useState(null);
  const [invoiceText, setInvoiceText] = useState("");
  const [billItems, setBillItems] = useState([]);
  const [isCombinedBill, setIsCombinedBill] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState({}); // Map orderId -> customerId
  const [selectedCustomerForTable, setSelectedCustomerForTable] = useState({}); // Map tableId -> customerId
  const [tables, setTables] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await API.get("/orders");
      const completedOrders = res.data.filter((o) => o.status === "COMPLETED");
      setOrders(completedOrders);
      
      // Check which orders already have bills
      const map = {};
      for (const order of completedOrders) {
        try {
          const billRes = await API.get(`/billing/order/${order.id}`);
          map[order.id] = billRes.data.id;
        } catch (err) {
          // No bill exists for this order yet
        }
      }
      setOrderBillsMap(map);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  const loadBills = async () => {
    try {
      const res = await API.get("/billing");
      setBills(res.data);
    } catch (err) {
      // If endpoint doesn't exist, just load orders
      console.log("Bills endpoint not available");
    }
    await loadOrders();
  };

  const loadCustomers = async () => {
    try {
      const res = await API.get("/customers/active");
      setCustomers(res.data);
    } catch (err) {
      console.log("Customers endpoint not available");
    }
  };

  const loadTables = async () => {
    try {
      const res = await API.get("/tables");
      setTables(res.data);
    } catch (err) {
      console.log("Tables endpoint not available");
    }
  };

  useEffect(() => {
    loadBills();
    loadCustomers();
    loadTables();
  }, []);

  const generateBill = async (orderId) => {
    try {
      const payload = {};
      if (selectedCustomerForOrder[orderId]) {
        payload.customerId = selectedCustomerForOrder[orderId];
      }
      const res = await API.post(`/billing/generate/${orderId}`, payload);
      toast.success("Bill generated successfully!");
      setOrderBillsMap({ ...orderBillsMap, [orderId]: res.data.id });
      loadOrders();
      // Automatically show the generated bill
      setSelectedBill(res.data);
      // Clear customer selection for this order
      const newCustomerMap = { ...selectedCustomerForOrder };
      delete newCustomerMap[orderId];
      setSelectedCustomerForOrder(newCustomerMap);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to generate bill";
      toast.error(errorMsg);
      console.error("Bill generation error:", err);
    }
  };

  const generateCombinedBillForTable = async (tableId) => {
    try {
      const payload = {};
      if (selectedCustomerForTable[tableId]) {
        payload.customerId = selectedCustomerForTable[tableId];
      }
      const res = await API.post(`/billing/generate/table/${tableId}`, payload);
      toast.success("Combined bill generated successfully for all orders!");
      loadOrders();
      // Automatically show the generated bill
      setSelectedBill(res.data);
      // Clear customer selection for this table
      const newCustomerMap = { ...selectedCustomerForTable };
      delete newCustomerMap[tableId];
      setSelectedCustomerForTable(newCustomerMap);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to generate combined bill";
      toast.error(errorMsg);
      console.error("Combined bill generation error:", err);
    }
  };

  const viewBill = async (billId) => {
    try {
      const [billRes, itemsRes] = await Promise.all([
        API.get(`/billing/${billId}`),
        API.get(`/billing/${billId}/items`),
      ]);
      setSelectedBill(billRes.data);
      setBillItems(itemsRes.data.items || []);
      setIsCombinedBill(itemsRes.data.isCombinedBill || false);
      setOrderCount(itemsRes.data.orderCount || 1);
      setInvoiceText(""); // Clear invoice text initially
    } catch (err) {
      toast.error("Failed to load bill details");
      console.error("View bill error:", err);
    }
  };

  const loadInvoiceText = async (billId) => {
    try {
      const invoiceRes = await API.get(`/billing/${billId}/invoice`);
      setInvoiceText(invoiceRes.data);
    } catch (err) {
      toast.error("Failed to load invoice");
      console.error("Invoice load error:", err);
    }
  };

  const downloadInvoice = async (billId) => {
    try {
      const res = await API.get(`/billing/download/${billId}`, {
        responseType: "blob",
      });
      
      // Check if response is actually a blob (PDF)
      if (res.data instanceof Blob) {
        // Check if it's a PDF or an error message
        if (res.data.type === "application/pdf" || res.data.size > 0) {
          const url = window.URL.createObjectURL(res.data);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `invoice-${billId}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          toast.success("Invoice downloaded!");
        } else {
          // If it's not a PDF, try to read as text (error message)
          const text = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsText(res.data);
          });
          toast.error(text || "Failed to download invoice");
        }
      } else {
        toast.error("Invalid response format");
      }
    } catch (err) {
      console.error("Download error:", err);
      // Try to extract error message from response
      let errorMsg = "Failed to download invoice";
      if (err.response) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsText(err.response.data);
            });
            errorMsg = text || errorMsg;
          } catch (e) {
            errorMsg = err.response.statusText || errorMsg;
          }
        } else {
          errorMsg = err.response.data?.message || err.response.statusText || errorMsg;
        }
      } else {
        errorMsg = err.message || errorMsg;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Billing</h1>
          <p className="text-sm text-gray-500">Generate and manage bills for completed orders</p>
        </div>

        {/* Combined Bills by Table */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Generate Combined Bill by Table
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate a single bill combining all completed orders for a table
          </p>
          {tables.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No tables available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => {
                const tableOrders = orders.filter((o) => o.table?.id === table.id);
                const hasUnbilledOrders = tableOrders.some((o) => !orderBillsMap[o.id]);
                
                if (tableOrders.length === 0 || !hasUnbilledOrders) {
                  return null;
                }
                
                const totalAmount = tableOrders
                  .filter((o) => !orderBillsMap[o.id])
                  .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                
                return (
                  <div key={table.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Table {table.tableNumber}</h3>
                        {table.location && (
                          <p className="text-xs text-gray-500">{table.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        {tableOrders.filter((o) => !orderBillsMap[o.id]).length} order(s) ready for billing
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        Total: ₹{totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="mb-3">
                      <select
                        className="input-field text-sm w-full"
                        value={selectedCustomerForTable[table.id] || ""}
                        onChange={(e) => {
                          setSelectedCustomerForTable({
                            ...selectedCustomerForTable,
                            [table.id]: e.target.value || null,
                          });
                        }}
                      >
                        <option value="">Walk-in Customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.gstin ? `(${customer.gstin})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    {can(userRole, "canGenerateBills") && (
                      <button
                        onClick={() => generateCombinedBillForTable(table.id)}
                        className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors"
                      >
                        Generate Combined Bill
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders Ready for Billing */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Completed Orders Ready for Billing ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No completed orders available for billing</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer (B2B)</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <p className="font-mono text-xs text-gray-700">{order.id.substring(0, 8)}...</p>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-900">
                          {order.table?.tableNumber || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        {orderBillsMap[order.id] ? (
                          <span className="text-sm text-gray-500">Bill Generated</span>
                        ) : (
                          <select
                            className="input-field text-sm w-48"
                            value={selectedCustomerForOrder[order.id] || ""}
                            onChange={(e) => {
                              setSelectedCustomerForOrder({
                                ...selectedCustomerForOrder,
                                [order.id]: e.target.value || null,
                              });
                            }}
                          >
                            <option value="">Walk-in Customer</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} {customer.gstin ? `(${customer.gstin})` : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-3 font-medium text-gray-900">₹{order.totalAmount?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                      </td>
                      <td className="p-3">
                        {orderBillsMap[order.id] ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewBill(orderBillsMap[order.id])}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors"
                            >
                              View Bill
                            </button>
                            <button
                              onClick={() => downloadInvoice(orderBillsMap[order.id])}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          can(userRole, "canGenerateBills") && (
                          <button
                            onClick={() => generateBill(order.id)}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors"
                          >
                            Generate Bill
                          </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bill Details Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
                  <button
                    onClick={() => {
                      setSelectedBill(null);
                      setInvoiceText("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {invoiceText ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700">{invoiceText}</pre>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => downloadInvoice(selectedBill.id)}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBill(null);
                          setInvoiceText("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Bill ID</p>
                        <p className="font-mono text-sm text-gray-900">{selectedBill.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {isCombinedBill ? "Orders" : "Order ID"}
                        </p>
                        <p className="font-mono text-sm text-gray-900">
                          {isCombinedBill 
                            ? `${orderCount} orders combined`
                            : `${selectedBill.order?.id?.substring(0, 8)}...`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                        <p className="text-lg font-semibold text-gray-900">₹{selectedBill.totalAmount?.toFixed(2)}</p>
                      </div>
                      {selectedBill.companyGstin && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Company GSTIN</p>
                          <p className="text-sm font-medium text-gray-900">{selectedBill.companyGstin}</p>
                        </div>
                      )}
                      {selectedBill.customerGstin && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Customer GSTIN</p>
                          <p className="text-sm font-medium text-gray-900">{selectedBill.customerGstin}</p>
                        </div>
                      )}
                      {selectedBill.isInterState ? (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">IGST</p>
                          <p className="text-lg font-semibold text-gray-900">₹{selectedBill.igst?.toFixed(2) || "0.00"}</p>
                        </div>
                      ) : (
                        <>
                          {selectedBill.cgst != null && selectedBill.cgst > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">CGST</p>
                              <p className="text-lg font-semibold text-gray-900">₹{selectedBill.cgst.toFixed(2)}</p>
                            </div>
                          )}
                          {selectedBill.sgst != null && selectedBill.sgst > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">SGST</p>
                              <p className="text-lg font-semibold text-gray-900">₹{selectedBill.sgst.toFixed(2)}</p>
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Tax</p>
                        <p className="text-lg font-semibold text-gray-900">₹{selectedBill.tax?.toFixed(2)}</p>
                      </div>
                      {selectedBill.placeOfSupply && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Place of Supply</p>
                          <p className="text-sm font-medium text-gray-900">{selectedBill.placeOfSupply}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Grand Total</p>
                        <p className="text-2xl font-bold text-gray-900">₹{selectedBill.grandTotal?.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Items List */}
                    {billItems.length > 0 && (
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
                              {billItems.map((item, index) => (
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
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => loadInvoiceText(selectedBill.id)}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
                      >
                        View Invoice Text
                      </button>
                      <button
                        onClick={() => downloadInvoice(selectedBill.id)}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBill(null);
                          setInvoiceText("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

