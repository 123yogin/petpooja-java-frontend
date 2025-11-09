import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickOrderTable, setQuickOrderTable] = useState(null);

  const loadTables = async () => {
    try {
      const res = await API.get("/tables");
      setTables(res.data);
    } catch (err) {
      toast.error("Failed to load tables");
    }
  };

  const loadOutlets = async () => {
    try {
      const res = await API.get("/outlets/active");
      setOutlets(res.data);
      if (res.data.length > 0 && !selectedOutlet) {
        setSelectedOutlet(res.data[0].id); // Auto-select first outlet
      }
    } catch (err) {
      console.log("Outlets not available");
    }
  };

  useEffect(() => {
    loadTables();
    loadOutlets();
  }, []);

  const createTable = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tables", {
        tableNumber,
        occupied: false,
        capacity: capacity ? parseInt(capacity) : null,
        location: location || null,
        outletId: selectedOutlet || null,
      });
      setTableNumber("");
      setCapacity("");
      setLocation("");
      toast.success("Table created!");
      loadTables();
    } catch (err) {
      toast.error("Failed to create table");
    }
  };

  const deleteTable = async (id) => {
    if (!window.confirm("Delete this table?")) return;
    try {
      await API.delete(`/tables/${id}`);
      toast.success("Table deleted!");
      loadTables();
    } catch (err) {
      toast.error("Failed to delete table");
    }
  };

  const toggleOccupied = async (table) => {
    try {
      await API.put(`/tables/${table.id}`, {
        tableNumber: table.tableNumber,
        occupied: !table.occupied,
        capacity: table.capacity,
        location: table.location,
        outletId: table.outlet?.id || null,
      });
      toast.success(`Table ${!table.occupied ? "occupied" : "vacated"}!`);
      loadTables();
    } catch (err) {
      toast.error("Failed to update table");
    }
  };

  const handleQuickOrder = (table) => {
    setQuickOrderTable(table);
    setShowQuickOrder(true);
  };

  const viewTableDetails = async (table) => {
    try {
      const ordersRes = await API.get("/orders");
      const tableOrdersList = ordersRes.data.filter(
        (order) => order.table?.id === table.id
      );
      setTableOrders(tableOrdersList);
      setSelectedTable(table);
    } catch (err) {
      toast.error("Failed to load table details");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Table Management</h1>
          <p className="text-sm text-gray-500">Manage restaurant tables and their status</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Table</h2>
          <form onSubmit={createTable} className="space-y-3">
            {outlets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Outlet</label>
                <select
                  className="input-field"
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                >
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name} ({outlet.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                placeholder="Table Number (e.g., T1)"
                className="input-field"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Capacity (optional)"
                className="input-field"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
              />
              <input
                placeholder="Location (e.g., Floor 1)"
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Add Table
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tables ({tables.length})</h2>
          {tables.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No tables yet. Add some above!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-lg border transition-all ${
                    t.occupied
                      ? "bg-white border-gray-300"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{t.tableNumber}</h3>
                      {t.capacity && (
                        <p className="text-xs text-gray-500 mt-1">Capacity: {t.capacity} seats</p>
                      )}
                      {t.location && (
                        <p className="text-xs text-gray-500">{t.location}</p>
                      )}
                    </div>
                    <span
                      className={`badge ${
                        t.occupied
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t.occupied ? "Occupied" : "Available"}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => viewTableDetails(t)}
                      className="flex-1 btn-primary text-sm"
                    >
                      View Details
                    </button>
                    {!t.occupied && (
                      <button
                        onClick={() => handleQuickOrder(t)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Create Order
                      </button>
                    )}
                    <button
                      onClick={() => toggleOccupied(t)}
                      className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
                    >
                      {t.occupied ? "Vacate" : "Occupy"}
                    </button>
                    <button
                      onClick={() => deleteTable(t.id)}
                      className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Details Modal */}
        {selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Table {selectedTable.tableNumber} Details
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      setTableOrders([]);
                    }}
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
                      <p className="text-sm text-gray-500 mb-1">Table Number</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedTable.tableNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span
                        className={`badge ${
                          selectedTable.occupied
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedTable.occupied ? "Occupied" : "Available"}
                      </span>
                    </div>
                    {selectedTable.capacity && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Capacity</p>
                        <p className="text-base font-medium text-gray-900">{selectedTable.capacity} seats</p>
                      </div>
                    )}
                    {selectedTable.location && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <p className="text-base font-medium text-gray-900">{selectedTable.location}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">
                      Orders ({tableOrders.length})
                    </h3>
                    {tableOrders.length === 0 ? (
                      <p className="text-gray-500 text-sm">No orders for this table</p>
                    ) : (
                      <div className="space-y-2">
                        {tableOrders.map((order) => (
                          <div
                            key={order.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Order {order.id.substring(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleString()
                                    : ""}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Status:{" "}
                                  <span className="font-medium">{order.status}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  ₹{order.totalAmount?.toFixed(2) || "0.00"}
                                </p>
                                {order.items && order.items.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {order.items.length} item{order.items.length > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                                <ul className="space-y-1">
                                  {order.items.map((item, idx) => (
                                    <li key={idx} className="text-xs text-gray-600">
                                      {item.menuItem?.name || "Unknown"} × {item.quantity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Order Modal */}
        {showQuickOrder && quickOrderTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Create Order for Table {quickOrderTable.tableNumber}
                  </h2>
                  <button
                    onClick={() => {
                      setShowQuickOrder(false);
                      setQuickOrderTable(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Redirecting to Orders page to create an order for this table...
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      window.location.href = `/orders?table=${quickOrderTable.id}`;
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Go to Orders
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickOrder(false);
                      setQuickOrderTable(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

