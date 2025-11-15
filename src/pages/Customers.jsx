import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    creditLimit: "",
    paymentTerms: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      toast.error("Failed to load customers");
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addCustomer = async (e) => {
    e.preventDefault();
    try {
      await API.post("/customers", {
        ...form,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
      });
      setForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstin: "",
        creditLimit: "",
        paymentTerms: "",
        isActive: true,
      });
      setShowModal(false);
      toast.success("Customer added!");
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add customer");
    }
  };

  const updateCustomer = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/customers/${editingId}`, {
        ...form,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
      });
      toast.success("Customer updated!");
      loadCustomers();
      setEditingId(null);
      setForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstin: "",
        creditLimit: "",
        paymentTerms: "",
        isActive: true,
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update customer");
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await API.delete(`/customers/${id}`);
        toast.success("Customer deleted!");
        loadCustomers();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete customer");
      }
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      contactPerson: customer.contactPerson || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      gstin: customer.gstin || "",
      creditLimit: customer.creditLimit?.toString() || "",
      paymentTerms: customer.paymentTerms || "",
      isActive: customer.isActive !== undefined ? customer.isActive : true,
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      creditLimit: "",
      paymentTerms: "",
      isActive: true,
    });
    setShowModal(false);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Customer Management</h1>
          <p className="text-sm text-gray-500">Manage B2B customers and company information</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            cancelEdit();
            setShowModal(true);
          }} className="btn-primary">
            + Add New Customer
          </button>
        </div>

        {/* Customers List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              All Customers ({filteredCustomers.length})
            </h2>
            <input
              type="text"
              placeholder="Search customers..."
              className="input-field w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {customers.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No customers added yet.</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No customers match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-900">{customer.name}</td>
                      <td className="p-3 text-gray-700">
                        {customer.contactPerson && (
                          <div>
                            <div className="font-medium">{customer.contactPerson}</div>
                            {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                          </div>
                        )}
                        {!customer.contactPerson && customer.phone && <div>{customer.phone}</div>}
                      </td>
                      <td className="p-3 text-gray-700">{customer.email || "N/A"}</td>
                      <td className="p-3 text-gray-700 font-mono text-xs">{customer.gstin || "N/A"}</td>
                      <td className="p-3 text-gray-700">{customer.state || "N/A"}</td>
                      <td className="p-3 text-gray-700">
                        {customer.creditLimit ? `₹${customer.creditLimit.toFixed(2)}` : "N/A"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`badge ${
                            customer.isActive
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => startEdit(customer)}
                          className="text-black hover:text-gray-900 text-sm font-medium mr-3 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer.id)}
                          className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Customer" : "Add New Customer"}
                  </h2>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={editingId ? updateCustomer : addCustomer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="name"
                      placeholder="Company/Customer Name *"
                      className="input-field"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                    />
                    <input
                      type="text"
                      name="contactPerson"
                      placeholder="Contact Person"
                      className="input-field"
                      value={form.contactPerson}
                      onChange={handleFormChange}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className="input-field"
                      value={form.email}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone Number"
                      className="input-field"
                      value={form.phone}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="gstin"
                      placeholder="GSTIN (15 characters)"
                      className="input-field"
                      value={form.gstin}
                      onChange={handleFormChange}
                      maxLength={15}
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State Code (e.g., 29 for Karnataka)"
                      className="input-field"
                      value={form.state}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      className="input-field"
                      value={form.address}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      className="input-field"
                      value={form.city}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      className="input-field"
                      value={form.pincode}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      name="creditLimit"
                      placeholder="Credit Limit (₹)"
                      step="0.01"
                      className="input-field"
                      value={form.creditLimit}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="paymentTerms"
                      placeholder="Payment Terms (e.g., Net 30)"
                      className="input-field"
                      value={form.paymentTerms}
                      onChange={handleFormChange}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleFormChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Active Customer</span>
                    </label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update Customer" : "Add Customer"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

