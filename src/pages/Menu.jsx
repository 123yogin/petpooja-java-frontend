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
  
  // Modifier management state
  const [modifierGroups, setModifierGroups] = useState([]);
  const [showModifierManagement, setShowModifierManagement] = useState(false);
  const [selectedModifierGroup, setSelectedModifierGroup] = useState(null);
  const [modifierGroupForm, setModifierGroupForm] = useState({
    name: "",
    description: "",
    isRequired: false,
    allowMultiple: false,
    minSelection: 0,
    maxSelection: null,
    isActive: true
  });
  const [editingModifierGroupId, setEditingModifierGroupId] = useState(null);
  const [modifierForm, setModifierForm] = useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
    displayOrder: ""
  });
  const [editingModifierId, setEditingModifierId] = useState(null);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [menuItemModifierGroups, setMenuItemModifierGroups] = useState({}); // Map menuItemId -> modifierGroups
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingMenuItem, setLinkingMenuItem] = useState(null);

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
    loadModifierGroups();
  }, []);

  const loadModifierGroups = async () => {
    try {
      const res = await API.get("/modifiers/groups");
      // Handle response parsing - ensure it's an array
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (typeof res.data === 'string') {
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          data = [];
        }
      }
      setModifierGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load modifier groups:", err);
      setModifierGroups([]);
    }
  };

  const loadModifiersForGroup = async (groupId) => {
    try {
      const res = await API.get(`/modifiers/groups/${groupId}/modifiers`);
      // Handle response parsing
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (typeof res.data === 'string') {
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          data = [];
        }
      }
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Failed to load modifiers:", err);
      return [];
    }
  };

  const loadModifierGroupsForMenuItem = async (menuItemId) => {
    try {
      const res = await API.get(`/modifiers/menu-items/${menuItemId}/modifier-groups`);
      // Handle response parsing - ensure it's an array
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (typeof res.data === 'string') {
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          data = [];
        }
      }
      setMenuItemModifierGroups(prev => ({
        ...prev,
        [menuItemId]: Array.isArray(data) ? data : []
      }));
    } catch (err) {
      console.error("Failed to load modifier groups for menu item:", err);
      setMenuItemModifierGroups(prev => ({
        ...prev,
        [menuItemId]: []
      }));
    }
  };

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

  // Modifier Group Management
  const createModifierGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post("/modifiers/groups", {
        ...modifierGroupForm,
        maxSelection: modifierGroupForm.maxSelection ? parseInt(modifierGroupForm.maxSelection) : null,
        minSelection: parseInt(modifierGroupForm.minSelection) || 0
      });
      toast.success("Modifier group created!");
      setModifierGroupForm({
        name: "",
        description: "",
        isRequired: false,
        allowMultiple: false,
        minSelection: 0,
        maxSelection: null,
        isActive: true
      });
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to create modifier group");
    }
  };

  const updateModifierGroup = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/modifiers/groups/${editingModifierGroupId}`, {
        ...modifierGroupForm,
        maxSelection: modifierGroupForm.maxSelection ? parseInt(modifierGroupForm.maxSelection) : null,
        minSelection: parseInt(modifierGroupForm.minSelection) || 0
      });
      toast.success("Modifier group updated!");
      setEditingModifierGroupId(null);
      setModifierGroupForm({
        name: "",
        description: "",
        isRequired: false,
        allowMultiple: false,
        minSelection: 0,
        maxSelection: null,
        isActive: true
      });
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to update modifier group");
    }
  };

  const deleteModifierGroup = async (id) => {
    if (!window.confirm("Delete this modifier group? All modifiers in this group will also be deleted.")) return;
    try {
      await API.delete(`/modifiers/groups/${id}`);
      toast.success("Modifier group deleted!");
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to delete modifier group");
    }
  };

  const startEditModifierGroup = (group) => {
    setEditingModifierGroupId(group.id);
    setModifierGroupForm({
      name: group.name || "",
      description: group.description || "",
      isRequired: group.isRequired || false,
      allowMultiple: group.allowMultiple || false,
      minSelection: group.minSelection || 0,
      maxSelection: group.maxSelection || null,
      isActive: group.isActive !== undefined ? group.isActive : true
    });
  };

  const cancelEditModifierGroup = () => {
    setEditingModifierGroupId(null);
    setModifierGroupForm({
      name: "",
      description: "",
      isRequired: false,
      allowMultiple: false,
      minSelection: 0,
      maxSelection: null,
      isActive: true
    });
  };

  // Modifier Management
  const createModifier = async (e) => {
    e.preventDefault();
    if (!selectedModifierGroup) {
      toast.error("Please select a modifier group first");
      return;
    }
    try {
      await API.post("/modifiers/modifiers", {
        ...modifierForm,
        modifierGroupId: selectedModifierGroup.id,
        price: parseFloat(modifierForm.price) || 0,
        displayOrder: modifierForm.displayOrder ? parseInt(modifierForm.displayOrder) : null
      });
      toast.success("Modifier created!");
      setModifierForm({
        name: "",
        description: "",
        price: "",
        isActive: true,
        displayOrder: ""
      });
      setShowModifierModal(false);
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to create modifier");
    }
  };

  const updateModifier = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/modifiers/modifiers/${editingModifierId}`, {
        ...modifierForm,
        price: parseFloat(modifierForm.price) || 0,
        displayOrder: modifierForm.displayOrder ? parseInt(modifierForm.displayOrder) : null
      });
      toast.success("Modifier updated!");
      setEditingModifierId(null);
      setModifierForm({
        name: "",
        description: "",
        price: "",
        isActive: true,
        displayOrder: ""
      });
      setShowModifierModal(false);
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to update modifier");
    }
  };

  const deleteModifier = async (id) => {
    if (!window.confirm("Delete this modifier?")) return;
    try {
      await API.delete(`/modifiers/modifiers/${id}`);
      toast.success("Modifier deleted!");
      loadModifierGroups();
    } catch (err) {
      toast.error("Failed to delete modifier");
    }
  };

  const startEditModifier = (modifier) => {
    setEditingModifierId(modifier.id);
    setModifierForm({
      name: modifier.name || "",
      description: modifier.description || "",
      price: modifier.price?.toString() || "",
      isActive: modifier.isActive !== undefined ? modifier.isActive : true,
      displayOrder: modifier.displayOrder?.toString() || ""
    });
    setShowModifierModal(true);
  };

  const openAddModifierModal = (group) => {
    setSelectedModifierGroup(group);
    setEditingModifierId(null);
    setModifierForm({
      name: "",
      description: "",
      price: "",
      isActive: true,
      displayOrder: ""
    });
    setShowModifierModal(true);
  };

  // Link Modifier Groups to Menu Items
  const linkModifierGroupToMenuItem = async (menuItemId, modifierGroupId) => {
    try {
      await API.post(`/modifiers/menu-items/${menuItemId}/modifier-groups/${modifierGroupId}`, {
        displayOrder: 0
      });
      toast.success("Modifier group linked to menu item!");
      loadModifierGroupsForMenuItem(menuItemId);
    } catch (err) {
      toast.error("Failed to link modifier group");
    }
  };

  const unlinkModifierGroupFromMenuItem = async (menuItemId, modifierGroupId) => {
    if (!window.confirm("Unlink this modifier group from the menu item?")) return;
    try {
      // Note: This endpoint might need to be created in the backend
      // For now, we'll use a workaround by deleting the link
      const links = menuItemModifierGroups[menuItemId] || [];
      const link = links.find(l => l.modifierGroup.id === modifierGroupId);
      if (link) {
        await API.delete(`/modifiers/menu-items/${menuItemId}/modifier-groups/${modifierGroupId}`);
        toast.success("Modifier group unlinked!");
        loadModifierGroupsForMenuItem(menuItemId);
      }
    } catch (err) {
      toast.error("Failed to unlink modifier group");
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
              <span key={cat} className="badge bg-gray-100 text-gray-800">
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

        {/* Add Button and Modifier Management Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowModifierManagement(!showModifierManagement)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            {showModifierManagement ? "Hide" : "Show"} Modifier Management
          </button>
          <button onClick={openAddModal} className="btn-primary">
            + Add New Menu Item
          </button>
        </div>

        {/* Modifier Management Section */}
        {showModifierManagement && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Modifier Groups</h2>
            
            {/* Modifier Group Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                {editingModifierGroupId ? "Edit Modifier Group" : "Create New Modifier Group"}
              </h3>
              <form onSubmit={editingModifierGroupId ? updateModifierGroup : createModifierGroup} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    placeholder="Group Name (e.g., Size, Toppings)"
                    className="input-field"
                    value={modifierGroupForm.name}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, name: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Description (optional)"
                    className="input-field"
                    value={modifierGroupForm.description}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modifierGroupForm.isRequired}
                      onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, isRequired: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modifierGroupForm.allowMultiple}
                      onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, allowMultiple: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Allow Multiple</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Min Selection"
                    min="0"
                    className="input-field"
                    value={modifierGroupForm.minSelection}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, minSelection: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    placeholder="Max Selection (optional)"
                    min="1"
                    className="input-field"
                    value={modifierGroupForm.maxSelection || ""}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, maxSelection: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingModifierGroupId ? "Update Group" : "Create Group"}
                  </button>
                  {editingModifierGroupId && (
                    <button
                      type="button"
                      onClick={cancelEditModifierGroup}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Modifier Groups List */}
            <div className="space-y-4">
              {modifierGroups.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No modifier groups yet. Create one above!</p>
              ) : (
                modifierGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {group.name}
                          {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        {group.description && (
                          <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {group.allowMultiple ? "Multiple" : "Single"} selection
                          </span>
                          {group.minSelection > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              Min: {group.minSelection}
                            </span>
                          )}
                          {group.maxSelection && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              Max: {group.maxSelection}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            group.isActive ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-500"
                          }`}>
                            {group.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedModifierGroup(group);
                            openAddModifierModal(group);
                          }}
                          className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                        >
                          + Add Modifier
                        </button>
                        <button
                          onClick={() => startEditModifierGroup(group)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteModifierGroup(group.id)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Modifiers in this group */}
                    {group.modifiers && group.modifiers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Modifiers:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.modifiers
                            .filter(m => m.isActive)
                            .map((modifier) => (
                            <div key={modifier.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="text-sm text-gray-900">{modifier.name}</span>
                                {modifier.price > 0 && (
                                  <span className="text-xs text-gray-600 ml-2">+₹{modifier.price.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditModifier(modifier)}
                                  className="text-xs text-gray-600 hover:text-gray-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteModifier(modifier.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
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
                            className="font-medium text-gray-900 hover:text-black text-left"
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
                                ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                            }`}
                          >
                            {i.available ? "Yes" : "No"}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setLinkingMenuItem(i);
                                loadModifierGroupsForMenuItem(i.id);
                                setShowLinkModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                              title="Manage Modifiers"
                            >
                              Modifiers
                            </button>
                            <button
                              onClick={() => startEdit(i)}
                              className="text-black hover:text-gray-900 text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(i.id)}
                              className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
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
                        <span className="badge bg-gray-100 text-gray-800">{selectedItem.category}</span>
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
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-200 text-gray-900"
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

                  {/* Linked Modifier Groups */}
                  <div className="pt-4 border-t">
                    <h3 className="text-base font-medium text-gray-900 mb-3">Linked Modifier Groups</h3>
                    {menuItemModifierGroups[selectedItem.id] && Array.isArray(menuItemModifierGroups[selectedItem.id]) && menuItemModifierGroups[selectedItem.id].length > 0 ? (
                      <div className="space-y-2">
                        {menuItemModifierGroups[selectedItem.id]
                          .filter(link => link && link.modifierGroup) // Filter out invalid links
                          .map((link) => (
                            <div key={link.id || link.modifierGroup?.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">{link.modifierGroup?.name || 'Unnamed Group'}</span>
                              <button
                                onClick={() => unlinkModifierGroupFromMenuItem(selectedItem.id, link.modifierGroup.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Unlink
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No modifier groups linked</p>
                    )}
                    <button
                      onClick={() => {
                        setLinkingMenuItem(selectedItem);
                        loadModifierGroupsForMenuItem(selectedItem.id);
                        setShowLinkModal(true);
                        setSelectedItem(null);
                      }}
                      className="mt-3 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      Link Modifier Groups
                    </button>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        startEdit(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
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

        {/* Modifier Modal */}
        {showModifierModal && selectedModifierGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingModifierId ? "Edit Modifier" : "Add Modifier to " + selectedModifierGroup.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModifierModal(false);
                      setEditingModifierId(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={editingModifierId ? updateModifier : createModifier} className="space-y-3">
                  <input
                    placeholder="Modifier Name (e.g., Small, Large, Extra Cheese)"
                    className="input-field"
                    value={modifierForm.name}
                    onChange={(e) => setModifierForm({ ...modifierForm, name: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Description (optional)"
                    className="input-field"
                    value={modifierForm.description}
                    onChange={(e) => setModifierForm({ ...modifierForm, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Additional Price"
                      className="input-field"
                      value={modifierForm.price}
                      onChange={(e) => setModifierForm({ ...modifierForm, price: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Display Order"
                      className="input-field"
                      value={modifierForm.displayOrder}
                      onChange={(e) => setModifierForm({ ...modifierForm, displayOrder: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modifierForm.isActive}
                      onChange={(e) => setModifierForm({ ...modifierForm, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn-primary flex-1">
                      {editingModifierId ? "Update" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModifierModal(false);
                        setEditingModifierId(null);
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

        {/* Link Modifier Groups to Menu Item Modal */}
        {showLinkModal && linkingMenuItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Link Modifier Groups to {linkingMenuItem.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowLinkModal(false);
                      setLinkingMenuItem(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Modifier Groups</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {modifierGroups && Array.isArray(modifierGroups) && modifierGroups.length > 0 ? (
                        modifierGroups
                          .filter(group => {
                            const linked = menuItemModifierGroups[linkingMenuItem.id] || [];
                            return !linked.some(l => l && l.modifierGroup && l.modifierGroup.id === group.id);
                          })
                          .map((group) => (
                            <div key={group.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-900">{group.name || 'Unnamed Group'}</span>
                                {group.description && (
                                  <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => linkModifierGroupToMenuItem(linkingMenuItem.id, group.id)}
                                className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800 text-sm"
                              >
                                Link
                              </button>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No modifier groups available</p>
                      )}
                      {modifierGroups && Array.isArray(modifierGroups) && modifierGroups.filter(group => {
                        const linked = menuItemModifierGroups[linkingMenuItem.id] || [];
                        return !linked.some(l => l && l.modifierGroup && l.modifierGroup.id === group.id);
                      }).length === 0 && modifierGroups.length > 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">All modifier groups are linked</p>
                      )}
                    </div>
                  </div>

                  {menuItemModifierGroups[linkingMenuItem.id] && Array.isArray(menuItemModifierGroups[linkingMenuItem.id]) && menuItemModifierGroups[linkingMenuItem.id].length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Modifier Groups</h4>
                      <div className="space-y-2">
                        {menuItemModifierGroups[linkingMenuItem.id]
                          .filter(link => link && link.modifierGroup) // Filter out invalid links
                          .map((link) => (
                            <div key={link.id || link.modifierGroup?.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                              <span className="font-medium text-gray-900">{link.modifierGroup?.name || 'Unnamed Group'}</span>
                              <button
                                onClick={() => unlinkModifierGroupFromMenuItem(linkingMenuItem.id, link.modifierGroup.id)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                              >
                                Unlink
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowLinkModal(false);
                        setLinkingMenuItem(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
