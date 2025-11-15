import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", threshold: "" });
  const [linkForm, setLinkForm] = useState({ menuItemId: "", ingredientId: "", quantityRequired: "" });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadIngredients = async () => {
    try {
      const res = await API.get("/inventory/ingredients");
      setIngredients(res.data);
    } catch (err) {
      toast.error("Failed to load ingredients");
    }
  };

  const loadMenuItems = async () => {
    try {
      const res = await API.get("/menu");
      setMenuItems(res.data);
    } catch (err) {
      toast.error("Failed to load menu items");
    }
  };

  useEffect(() => {
    loadIngredients();
    loadMenuItems();
  }, []);

  const addIngredient = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory/ingredients", {
        name: form.name,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        threshold: parseFloat(form.threshold),
      });
      setForm({ name: "", quantity: "", unit: "", threshold: "" });
      setShowModal(false);
      toast.success("Ingredient added!");
      loadIngredients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add ingredient");
    }
  };

  const updateIngredient = async (id, updatedData) => {
    try {
      await API.put(`/inventory/ingredients/${id}`, updatedData);
      toast.success("Ingredient updated!");
      loadIngredients();
      setEditingId(null);
      setForm({ name: "", quantity: "", unit: "", threshold: "" });
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to update ingredient");
    }
  };

  const linkMenuItem = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory/menu-link", {
        menuItemId: linkForm.menuItemId,
        ingredientId: linkForm.ingredientId,
        quantityRequired: parseFloat(linkForm.quantityRequired),
      });
      setLinkForm({ menuItemId: "", ingredientId: "", quantityRequired: "" });
      toast.success("Menu item linked to ingredient!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to link menu item");
    }
  };

  const getStockStatus = (ingredient) => {
    if (ingredient.quantity <= ingredient.threshold) {
      return { label: "Low Stock", color: "bg-gray-200 text-gray-900" };
    } else if (ingredient.quantity <= ingredient.threshold * 1.5) {
      return { label: "Warning", color: "bg-gray-200 text-gray-800" };
    }
    return { label: "In Stock", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Inventory Management</h1>
          <p className="text-sm text-gray-500">Manage ingredients and stock levels</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            setEditingId(null);
            setForm({ name: "", quantity: "", unit: "", threshold: "" });
            setShowModal(true);
          }} className="btn-primary">
            + Add New Ingredient
          </button>
        </div>

        {/* Link Menu Item to Ingredient */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Link Menu Item to Ingredient</h2>
          <form onSubmit={linkMenuItem} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="input-field"
              value={linkForm.menuItemId}
              onChange={(e) => setLinkForm({ ...linkForm, menuItemId: e.target.value })}
              required
            >
              <option value="">Select Menu Item</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={linkForm.ingredientId}
              onChange={(e) => setLinkForm({ ...linkForm, ingredientId: e.target.value })}
              required
            >
              <option value="">Select Ingredient</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Quantity Required"
              type="number"
              step="0.01"
              className="input-field"
              value={linkForm.quantityRequired}
              onChange={(e) => setLinkForm({ ...linkForm, quantityRequired: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary">
              Link
            </button>
          </form>
        </div>

        {/* Ingredients List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Ingredients ({ingredients.length})
          </h2>
          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No ingredients yet. Add some above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => {
                    const status = getStockStatus(ing);
                    return (
                      <tr key={ing.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-900">{ing.name}</td>
                        <td className="p-3 text-gray-900">{ing.quantity.toFixed(2)}</td>
                        <td className="p-3 text-gray-500">{ing.unit || "N/A"}</td>
                        <td className="p-3 text-gray-500">{ing.threshold.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`badge ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setEditingId(ing.id);
                              setForm({
                                name: ing.name,
                                quantity: ing.quantity.toString(),
                                unit: ing.unit || "",
                                threshold: ing.threshold.toString(),
                              });
                              setShowModal(true);
                            }}
                            className="text-black hover:text-gray-900 text-sm font-medium mr-3 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Ingredient Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Ingredient" : "Add New Ingredient"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setForm({ name: "", quantity: "", unit: "", threshold: "" });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={editingId ? (e) => {
                  e.preventDefault();
                  const ingredient = ingredients.find((i) => i.id === editingId);
                  updateIngredient(editingId, {
                    name: form.name || ingredient.name,
                    quantity: form.quantity ? parseFloat(form.quantity) : ingredient.quantity,
                    unit: form.unit || ingredient.unit,
                    threshold: form.threshold ? parseFloat(form.threshold) : ingredient.threshold,
                  });
                } : addIngredient} className="space-y-4">
                  <input
                    placeholder="Ingredient Name"
                    className="input-field w-full"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
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
                      placeholder="Unit (g, ml, pcs)"
                      className="input-field"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      required
                    />
                  </div>
                  <input
                    placeholder="Threshold"
                    type="number"
                    step="0.01"
                    className="input-field w-full"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
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
                        setForm({ name: "", quantity: "", unit: "", threshold: "" });
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

