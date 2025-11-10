import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: "", contact: "", email: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const addSupplier = async (e) => {
    e.preventDefault();
    try {
      await API.post("/suppliers", form);
      setForm({ name: "", contact: "", email: "" });
      setShowModal(false);
      toast.success("Supplier added!");
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add supplier");
    }
  };

  const updateSupplier = async (id, updatedData) => {
    try {
      await API.put(`/suppliers/${id}`, updatedData);
      toast.success("Supplier updated!");
      loadSuppliers();
      setEditingId(null);
      setForm({ name: "", contact: "", email: "" });
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to update supplier");
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }
    try {
      await API.delete(`/suppliers/${id}`);
      toast.success("Supplier deleted!");
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Supplier Management</h1>
          <p className="text-sm text-gray-500">Manage your suppliers and vendor information</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            setEditingId(null);
            setForm({ name: "", contact: "", email: "" });
            setShowModal(true);
          }} className="btn-primary">
            + Add New Supplier
          </button>
        </div>

        {/* Search */}
        <div className="card">
            <input
              type="text"
            placeholder="Search suppliers by name, email, or contact..."
            className="input-field w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        {/* Suppliers List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Suppliers ({filteredSuppliers.length} of {suppliers.length})
          </h2>
          {suppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No suppliers yet. Add some above!
            </p>
          ) : filteredSuppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No suppliers match your search
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-900">{supplier.name || "N/A"}</td>
                      <td className="p-3 text-gray-700">{supplier.contact || "N/A"}</td>
                      <td className="p-3 text-gray-700">{supplier.email || "N/A"}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(supplier.id);
                              setForm({
                                name: supplier.name || "",
                                contact: supplier.contact || "",
                                email: supplier.email || "",
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Supplier" : "Add New Supplier"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setForm({ name: "", contact: "", email: "" });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={
                    editingId
                      ? (e) => {
                          e.preventDefault();
                          const supplier = suppliers.find((s) => s.id === editingId);
                          updateSupplier(editingId, {
                            name: form.name || supplier.name,
                            contact: form.contact || supplier.contact,
                            email: form.email || supplier.email,
                          });
                        }
                      : addSupplier
                  }
                  className="space-y-4"
                >
                  <input
                    placeholder="Supplier Name"
                    className="input-field w-full"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Contact Number"
                    className="input-field w-full"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Email Address"
                    type="email"
                    className="input-field w-full"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingId(null);
                        setForm({ name: "", contact: "", email: "" });
                      }}
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
