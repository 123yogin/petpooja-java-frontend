import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

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
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Table Management</h2>
        <form onSubmit={createTable} className="flex gap-2 mb-4">
          <input
            placeholder="Table Number (e.g., T1)"
            className="border p-2 rounded"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Table
          </button>
        </form>
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Table Number</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="border p-2">{t.tableNumber}</td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded ${
                      t.occupied
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {t.occupied ? "Occupied" : "Available"}
                  </span>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => toggleOccupied(t)}
                    className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded hover:bg-yellow-600"
                  >
                    {t.occupied ? "Vacate" : "Occupy"}
                  </button>
                  <button
                    onClick={() => deleteTable(t.id)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tables.length === 0 && (
          <p className="text-gray-500 mt-4">No tables yet. Add some above!</p>
        )}
      </div>
    </div>
  );
}

