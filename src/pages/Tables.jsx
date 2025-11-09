import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");

  const loadTables = async () => {
    try {
      const res = await API.get("/tables");
      setTables(res.data);
    } catch (err) {
      toast.error("Failed to load tables");
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const createTable = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tables", { tableNumber, occupied: false });
      setTableNumber("");
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
      });
      toast.success(`Table ${!table.occupied ? "occupied" : "vacated"}!`);
      loadTables();
    } catch (err) {
      toast.error("Failed to update table");
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
          <form onSubmit={createTable} className="flex gap-3">
            <input
              placeholder="Table Number (e.g., T1)"
              className="input-field flex-1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary px-6">
              Add Table
            </button>
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
                    <h3 className="text-xl font-semibold text-gray-900">{t.tableNumber}</h3>
                    <span
                      className={`badge ${
                        t.occupied
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t.occupied ? "Occupied" : "Available"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleOccupied(t)}
                      className="flex-1 btn-primary text-sm"
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
      </div>
    </Layout>
  );
}

