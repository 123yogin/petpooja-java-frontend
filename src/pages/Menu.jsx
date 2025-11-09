import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", price: "" });

  const loadItems = async () => {
    try {
      const res = await API.get("/menu");
      setItems(res.data);
    } catch (err) {
      toast.error("Failed to load menu items");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await API.post("/menu", { ...form, price: parseFloat(form.price) });
      setForm({ name: "", category: "", price: "" });
      toast.success("Menu item added!");
      loadItems();
    } catch (err) {
      toast.error("Failed to add menu item");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await API.delete(`/menu/${id}`);
      toast.success("Menu item deleted!");
      loadItems();
    } catch (err) {
      toast.error("Failed to delete menu item");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Menu Management</h1>
          <p className="text-sm text-gray-500">Add, edit, and manage your menu items</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Menu Item</h2>
          <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Item Name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Category"
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <input
              placeholder="Price"
              type="number"
              step="0.01"
              className="input-field"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary">
              Add Item
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Menu Items ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No menu items yet. Add some above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{i.name}</td>
                      <td className="p-3">
                        <span className="badge bg-gray-100 text-gray-700">{i.category}</span>
                      </td>
                      <td className="p-3 font-medium text-gray-900">₹{i.price}</td>
                      <td className="p-3">
                        <span className={`badge ${i.available ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-400"}`}>
                          {i.available ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteItem(i.id)}
                          className="text-gray-400 hover:text-gray-900 text-sm font-medium transition-colors"
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
      </div>
    </Layout>
  );
}

