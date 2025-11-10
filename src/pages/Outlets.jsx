import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Outlets() {
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    gstin: "",
    managerName: "",
    managerPhone: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadOutlets = async () => {
    try {
      const res = await API.get("/outlets");
      setOutlets(res.data);
    } catch (err) {
      toast.error("Failed to load outlets");
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addOutlet = async (e) => {
    e.preventDefault();
    try {
      await API.post("/outlets", form);
      toast.success("Outlet added!");
      loadOutlets();
      setForm({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        gstin: "",
        managerName: "",
        managerPhone: "",
        isActive: true,
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add outlet");
    }
  };

  const updateOutlet = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/outlets/${editingId}`, form);
      toast.success("Outlet updated!");
      loadOutlets();
      setEditingId(null);
      setForm({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        gstin: "",
        managerName: "",
        managerPhone: "",
        isActive: true,
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update outlet");
    }
  };

  const deleteOutlet = async (id) => {
    if (window.confirm("Are you sure you want to delete this outlet?")) {
      try {
        await API.delete(`/outlets/${id}`);
        toast.success("Outlet deleted!");
        loadOutlets();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete outlet");
      }
    }
  };

  const startEdit = (outlet) => {
    setEditingId(outlet.id);
    setForm({
      name: outlet.name || "",
      code: outlet.code || "",
      address: outlet.address || "",
      city: outlet.city || "",
      state: outlet.state || "",
      pincode: outlet.pincode || "",
      phone: outlet.phone || "",
      email: outlet.email || "",
      gstin: outlet.gstin || "",
      managerName: outlet.managerName || "",
      managerPhone: outlet.managerPhone || "",
      isActive: outlet.isActive !== undefined ? outlet.isActive : true,
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      gstin: "",
      managerName: "",
      managerPhone: "",
      isActive: true,
    });
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Outlet Management</h1>
          <p className="text-sm text-gray-500">Manage multiple restaurant outlets</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            cancelEdit();
            setShowModal(true);
          }} className="btn-primary">
            + Add New Outlet
          </button>
        </div>

        {/* Outlets List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">All Outlets ({outlets.length})</h2>
          {outlets.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No outlets added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{outlet.name}</h3>
                      <p className="text-xs text-gray-500">Code: {outlet.code}</p>
                    </div>
                    <span
                      className={`badge ${
                        outlet.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {outlet.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {outlet.address && (
                      <p>
                        <span className="font-medium">Address:</span> {outlet.address}
                        {outlet.city && `, ${outlet.city}`}
                        {outlet.state && `, ${outlet.state}`}
                      </p>
                    )}
                    {outlet.phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {outlet.phone}
                      </p>
                    )}
                    {outlet.managerName && (
                      <p>
                        <span className="font-medium">Manager:</span> {outlet.managerName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => startEdit(outlet)}
                      className="btn-outline btn-sm flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteOutlet(outlet.id)}
                      className="btn-danger btn-sm flex-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Outlet Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Outlet" : "Add New Outlet"}
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
                <form onSubmit={editingId ? updateOutlet : addOutlet} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="name"
                      placeholder="Outlet Name *"
                      className="input-field"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                    />
                    <input
                      type="text"
                      name="code"
                      placeholder="Outlet Code (Unique) *"
                      className="input-field"
                      value={form.code}
                      onChange={handleFormChange}
                      required
                    />
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
                      name="state"
                      placeholder="State"
                      className="input-field"
                      value={form.state}
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
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone Number"
                      className="input-field"
                      value={form.phone}
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
                    <input
                      type="text"
                      name="gstin"
                      placeholder="GSTIN (Optional)"
                      className="input-field"
                      value={form.gstin}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="managerName"
                      placeholder="Manager Name"
                      className="input-field"
                      value={form.managerName}
                      onChange={handleFormChange}
                    />
                    <input
                      type="text"
                      name="managerPhone"
                      placeholder="Manager Phone"
                      className="input-field"
                      value={form.managerPhone}
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
                      <span className="text-sm text-gray-700">Is Active</span>
                    </label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update Outlet" : "Add Outlet"}
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

