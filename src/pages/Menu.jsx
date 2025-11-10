import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "", available: true, hsnCode: "", taxRate: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categories, setCategories] = useState(["Appetizer", "Main Course", "Dessert", "Beverage", "Soup", "Salad"]);
  const [newCategory, setNewCategory] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  // Extract unique categories from items
  useEffect(() => {
    const itemCategories = [...new Set(items.map((i) => i.category).filter(Boolean))];
    setCategories((prev) => {
      const combined = [...new Set([...prev, ...itemCategories])];
      return combined.sort();
    });
  }, [items]);

  // Filter, sort, and paginate items
  useEffect(() => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available";
      filtered = filtered.filter((item) => item.available === isAvailable);
    }

    // Price filter
    if (priceFilter !== "all") {
      switch (priceFilter) {
        case "under50":
          filtered = filtered.filter((item) => item.price < 50);
          break;
        case "50-100":
          filtered = filtered.filter((item) => item.price >= 50 && item.price <= 100);
          break;
        case "100-200":
          filtered = filtered.filter((item) => item.price > 100 && item.price <= 200);
          break;
        case "over200":
          filtered = filtered.filter((item) => item.price > 200);
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "price":
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case "category":
          aVal = a.category?.toLowerCase() || "";
          bVal = b.category?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [items, searchTerm, categoryFilter, availabilityFilter, priceFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, itemsPerPage]);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await API.post("/menu", {
        ...form,
        price: parseFloat(form.price),
        description: form.description || null,
        hsnCode: form.hsnCode || null,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : 5.0,
      });
      setForm({ name: "", category: "", price: "", description: "", available: true, hsnCode: "", taxRate: "" });
      setShowModal(false);
      toast.success("Menu item added!");
      loadItems();
    } catch (err) {
      toast.error("Failed to add menu item");
    }
  };

  const updateItem = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/menu/${editingId}`, {
        ...form,
        price: parseFloat(form.price),
        description: form.description || null,
        hsnCode: form.hsnCode || null,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : 5.0,
      });
      setForm({ name: "", category: "", price: "", description: "", available: true, hsnCode: "", taxRate: "" });
      setEditingId(null);
      setShowModal(false);
      toast.success("Menu item updated!");
      loadItems();
    } catch (err) {
      toast.error("Failed to update menu item");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      category: item.category || "",
      price: item.price?.toString() || "",
      description: item.description || "",
      available: item.available !== undefined ? item.available : true,
      hsnCode: item.hsnCode || "",
      taxRate: item.taxRate?.toString() || "5.0",
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", category: "", price: "", description: "", available: true, hsnCode: "", taxRate: "" });
    setShowModal(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: "", category: "", price: "", description: "", available: true, hsnCode: "", taxRate: "" });
    setShowModal(true);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await API.delete(`/menu/${id}`);
      toast.success("Menu item deleted!");
      loadItems();
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } catch (err) {
      toast.error("Failed to delete menu item");
    }
  };

  const toggleAvailability = async (id) => {
    try {
      await API.put(`/menu/${id}/toggle-availability`);
      toast.success("Availability updated!");
      loadItems();
    } catch (err) {
      toast.error("Failed to toggle availability");
    }
  };

  const deleteBulk = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }
    if (!window.confirm(`Delete ${selectedItems.length} selected item(s)?`)) return;
    try {
      await API.delete("/menu/bulk", { data: selectedItems });
      toast.success(`${selectedItems.length} item(s) deleted!`);
      loadItems();
      setSelectedItems([]);
    } catch (err) {
      toast.error("Failed to delete items");
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedItems.map((item) => item.id));
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()].sort());
      setNewCategory("");
      toast.success("Category added!");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Menu Management</h1>
          <p className="text-sm text-gray-500">Add, edit, and manage your menu items</p>
        </div>

        {/* Category Management */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Category Management</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span key={cat} className="badge bg-blue-100 text-blue-800">
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new category..."
              className="input-field flex-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addCategory()}
            />
            <button onClick={addCategory} className="btn-primary px-4">
              Add Category
            </button>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <button onClick={openAddModal} className="btn-primary">
            + Add New Menu Item
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search & Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search by name, category, or description..."
              className="input-field md:col-span-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="input-field"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable Only</option>
            </select>
            <select
              className="input-field"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="under50">Under ₹50</option>
              <option value="50-100">₹50 - ₹100</option>
              <option value="100-200">₹100 - ₹200</option>
              <option value="over200">Over ₹200</option>
            </select>
          </div>
        </div>

        {/* Sorting and Bulk Actions */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                className="input-field text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
              >
                {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {selectedItems.length > 0 && (
                <button
                  onClick={deleteBulk}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Delete Selected ({selectedItems.length})
                </button>
              )}
              <span className="text-sm text-gray-600">
                Showing {paginatedItems.length} of {filteredItems.length} items
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Menu Items ({filteredItems.length} of {items.length})
          </h2>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No menu items yet. Add some above!</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No items match your filters</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">HSN Code</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(i.id)}
                            onChange={() => toggleSelectItem(i.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedItem(i)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-left"
                          >
                            {i.name}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="badge bg-gray-100 text-gray-700">{i.category}</span>
                        </td>
                        <td className="p-3 font-medium text-gray-900">₹{i.price?.toFixed(2) || "0.00"}</td>
                        <td className="p-3 text-sm text-gray-600">{i.hsnCode || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-600">{i.taxRate != null ? `${i.taxRate}%` : "5.0%"}</td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleAvailability(i.id)}
                            className={`badge cursor-pointer transition-colors ${
                              i.available
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {i.available ? "Yes" : "No"}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(i)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(i.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Items per page:</span>
                    <select
                      className="input-field text-sm w-20"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Menu Item Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
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
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="text-base font-medium text-gray-900">
                        <span className="badge bg-blue-100 text-blue-800">{selectedItem.category}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Price</p>
                      <p className="text-lg font-semibold text-gray-900">₹{selectedItem.price?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Availability</p>
                      <span
                        className={`badge ${
                          selectedItem.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedItem.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Item ID</p>
                      <p className="text-xs font-mono text-gray-600">{selectedItem.id}</p>
                    </div>
                  </div>

                  {selectedItem.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedItem.description}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        startEdit(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Edit Item
                    </button>
                    <button
                      onClick={() => {
                        toggleAvailability(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Toggle Availability
                    </button>
                    <button
                      onClick={() => setSelectedItem(null)}
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

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Menu Item" : "Add New Menu Item"}
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
                <form onSubmit={editingId ? updateItem : addItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      placeholder="Item Name"
                      className="input-field"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <select
                      className="input-field"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="HSN Code (e.g., 996331)"
                      className="input-field"
                      value={form.hsnCode}
                      onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                    />
                    <input
                      placeholder="Tax Rate % (default: 5.0)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="input-field"
                      value={form.taxRate}
                      onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    />
                  </div>
                  <textarea
                    placeholder="Description (optional)"
                    className="input-field w-full"
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.available}
                        onChange={(e) => setForm({ ...form, available: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Available</span>
                    </label>
                    <div className="flex gap-2 ml-auto">
                      <button type="submit" className="btn-primary">
                        {editingId ? "Update Item" : "Add Item"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
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
