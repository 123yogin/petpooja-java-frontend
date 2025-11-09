import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function AccountsReceivable() {
  const [summary, setSummary] = useState(null);
  const [pendingBills, setPendingBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerReceivables, setCustomerReceivables] = useState(null);

  const loadSummary = async () => {
    try {
      const res = await API.get("/accounts-receivable/summary");
      setSummary(res.data);
    } catch (err) {
      toast.error("Failed to load summary");
    }
  };

  const loadPendingBills = async () => {
    try {
      const res = await API.get("/accounts-receivable/pending");
      setPendingBills(res.data);
    } catch (err) {
      toast.error("Failed to load pending bills");
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await API.get("/customers/active");
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to load customers");
    }
  };

  const loadCustomerReceivables = async (customerId) => {
    try {
      const res = await API.get(`/accounts-receivable/customer/${customerId}`);
      setCustomerReceivables(res.data);
    } catch (err) {
      toast.error("Failed to load customer receivables");
    }
  };

  useEffect(() => {
    loadSummary();
    loadPendingBills();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerReceivables(selectedCustomer);
    } else {
      setCustomerReceivables(null);
    }
  }, [selectedCustomer]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Accounts Receivable</h1>
          <p className="text-sm text-gray-500">Track payments and outstanding receivables</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">Total Receivables</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{summary.totalReceivables?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">Pending Bills</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.pendingBills || 0}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">Overdue Bills</p>
              <p className="text-2xl font-semibold text-red-600">
                {summary.overdueBills || 0}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-1">Total Bills</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.totalBills || 0}
              </p>
            </div>
          </div>
        )}

        {/* Customer Selection */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">View Customer Receivables</h2>
          <select
            className="input-field w-full md:w-64"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.gstin && `(${customer.gstin})`}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Receivables Detail */}
        {customerReceivables && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Receivables for {customerReceivables.customer?.name}
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total Receivables:</span>{" "}
                ₹{customerReceivables.totalReceivables?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total Bills:</span> {customerReceivables.totalBills || 0}
              </p>
            </div>
            {customerReceivables.bills && customerReceivables.bills.length > 0 ? (
              <div className="space-y-3">
                {customerReceivables.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Bill #{bill.id?.toString().substring(0, 8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {bill.generatedAt ? new Date(bill.generatedAt).toLocaleDateString() : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Grand Total: ₹{bill.grandTotal?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Paid: ₹{bill.paidAmount?.toFixed(2) || "0.00"} | Pending: ₹{bill.pendingAmount?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <span className={`badge ${
                        bill.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
                        bill.paymentStatus === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
                        bill.paymentStatus === "OVERDUE" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {bill.paymentStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">No bills found for this customer.</p>
            )}
          </div>
        )}

        {/* Pending Bills List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Pending Bills ({pendingBills.length})
          </h2>
          {pendingBills.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No pending bills.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Bill ID</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBills.map((bill) => (
                    <tr key={bill.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-900">
                        {bill.id?.toString().substring(0, 8)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {bill.customer?.name || "Walk-in"}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {bill.generatedAt ? new Date(bill.generatedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        ₹{bill.grandTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        ₹{bill.paidAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3 text-sm font-medium text-red-600">
                        ₹{bill.pendingAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3">
                        <span className={`badge ${
                          bill.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
                          bill.paymentStatus === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
                          bill.paymentStatus === "OVERDUE" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {bill.paymentStatus || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

