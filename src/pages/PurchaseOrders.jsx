import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [form, setForm] = useState({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadPurchaseOrders = async () => {
    try {
      const res = await API.get("/purchase-orders");
      setPurchaseOrders(res.data);
    } catch (err) {
      toast.error("Failed to load purchase orders");
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  const loadIngredients = async () => {
    try {
      const res = await API.get("/inventory/ingredients");
      setIngredients(res.data);
    } catch (err) {
      toast.error("Failed to load ingredients");
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadIngredients();
  }, []);

  const addPurchaseOrder = async (e) => {
    e.preventDefault();
    try {
      await API.post("/purchase-orders", {
        supplierId: form.supplierId,
        ingredientId: form.ingredientId,
        quantity: parseFloat(form.quantity),
        cost: parseFloat(form.cost),
      });
      setForm({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
      setShowModal(false);
      toast.success("Purchase order created!");
      loadPurchaseOrders();
      loadIngredients(); // Reload to show updated quantities
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create purchase order");
    }
  };

  const updatePurchaseOrder = async (id, updatedData) => {
    try {
      await API.put(`/purchase-orders/${id}`, updatedData);
      toast.success("Purchase order updated!");
      loadPurchaseOrders();
      loadIngredients(); // Reload to show updated quantities
      setEditingId(null);
      setForm({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to update purchase order");
    }
  };

  const deletePurchaseOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase order? This will revert the ingredient quantity.")) {
      return;
    }
    try {
      await API.delete(`/purchase-orders/${id}`);
      toast.success("Purchase order deleted!");
      loadPurchaseOrders();
      loadIngredients(); // Reload to show updated quantities
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete purchase order");
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      po.supplier?.name?.toLowerCase().includes(searchLower) ||
      po.ingredient?.name?.toLowerCase().includes(searchLower) ||
      po.id?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Purchase Order Management</h1>
          <p className="text-sm text-gray-500">Create and manage purchase orders for ingredients</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            setEditingId(null);
            setForm({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
            setShowModal(true);
          }} className="btn-primary">
            + Create New Purchase Order
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <input
            type="text"
            placeholder="Search purchase orders by supplier, ingredient, or ID..."
            className="input-field w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Purchase Orders List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Purchase Orders ({filteredPurchaseOrders.length} of {purchaseOrders.length})
          </h2>
          {purchaseOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No purchase orders yet. Create one above!
            </p>
          ) : filteredPurchaseOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">
              No purchase orders match your search
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredient
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost (₹)
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (₹)
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-gray-700">
                        {po.date ? new Date(po.date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3 font-medium text-gray-900">
                        {po.supplier?.name || "N/A"}
                      </td>
                      <td className="p-3 text-gray-700">{po.ingredient?.name || "N/A"}</td>
                      <td className="p-3 text-gray-700">{po.quantity?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 text-gray-700">₹{po.cost?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 font-semibold text-gray-900">
                        ₹{((po.quantity || 0) * (po.cost || 0)).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(po.id);
                              setForm({
                                supplierId: po.supplier?.id || "",
                                ingredientId: po.ingredient?.id || "",
                                quantity: po.quantity?.toString() || "",
                                cost: po.cost?.toString() || "",
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePurchaseOrder(po.id)}
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

        {/* Add/Edit Purchase Order Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Purchase Order" : "Create New Purchase Order"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setForm({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
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
                          const po = purchaseOrders.find((p) => p.id === editingId);
                          updatePurchaseOrder(editingId, {
                            supplierId: form.supplierId || po.supplier?.id,
                            ingredientId: form.ingredientId || po.ingredient?.id,
                            quantity: form.quantity ? parseFloat(form.quantity) : po.quantity,
                            cost: form.cost ? parseFloat(form.cost) : po.cost,
                          });
                        }
                      : addPurchaseOrder
                  }
                  className="space-y-4"
                >
                  <select
                    className="input-field w-full"
                    value={form.supplierId}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-field w-full"
                    value={form.ingredientId}
                    onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}
                    required
                  >
                    <option value="">Select Ingredient</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Quantity"
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                    <input
                      placeholder="Cost (₹)"
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: Creating a purchase order will automatically update the ingredient quantity in inventory.
                  </p>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingId(null);
                        setForm({ supplierId: "", ingredientId: "", quantity: "", cost: "" });
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

