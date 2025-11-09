import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

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
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Menu Management</h2>
        <form onSubmit={addItem} className="flex gap-2 mb-4">
          <input
            placeholder="Name"
            className="border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Category"
            className="border p-2 rounded"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
          <input
            placeholder="Price"
            type="number"
            step="0.01"
            className="border p-2 w-24 rounded"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add
          </button>
        </form>
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Category</th>
              <th className="border p-2 text-left">Price</th>
              <th className="border p-2 text-left">Available</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="border p-2">{i.name}</td>
                <td className="border p-2">{i.category}</td>
                <td className="border p-2">₹{i.price}</td>
                <td className="border p-2">{i.available ? "Yes" : "No"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => deleteItem(i.id)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-gray-500 mt-4">No menu items yet. Add some above!</p>
        )}
      </div>
    </div>
  );
}

