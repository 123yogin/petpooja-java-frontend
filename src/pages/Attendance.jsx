import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "PRESENT",
    shift: "",
    remarks: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadAttendance = async () => {
    try {
      const res = await API.get("/attendance");
      setAttendance(res.data);
    } catch (err) {
      toast.error("Failed to load attendance");
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await API.get("/employees/active");
      setEmployees(res.data);
    } catch (err) {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadAttendance();
    loadEmployees();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckIn = async (employeeId) => {
    try {
      await API.post("/attendance/check-in", { employee: { id: employeeId } });
      toast.success("Check-in successful!");
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (employeeId) => {
    try {
      await API.post("/attendance/check-out", { employee: { id: employeeId } });
      toast.success("Check-out successful!");
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to check out");
    }
  };

  const addAttendance = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        employee: { id: form.employeeId },
        checkIn: form.checkIn ? new Date(`${form.date}T${form.checkIn}`).toISOString() : null,
        checkOut: form.checkOut ? new Date(`${form.date}T${form.checkOut}`).toISOString() : null,
      };
      await API.post("/attendance", payload);
      toast.success("Attendance recorded!");
      loadAttendance();
      setForm({
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        checkIn: "",
        checkOut: "",
        status: "PRESENT",
        shift: "",
        remarks: "",
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add attendance");
    }
  };

  const updateAttendance = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        checkIn: form.checkIn ? new Date(`${form.date}T${form.checkIn}`).toISOString() : null,
        checkOut: form.checkOut ? new Date(`${form.date}T${form.checkOut}`).toISOString() : null,
      };
      await API.put(`/attendance/${editingId}`, payload);
      toast.success("Attendance updated!");
      loadAttendance();
      setEditingId(null);
      setForm({
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        checkIn: "",
        checkOut: "",
        status: "PRESENT",
        shift: "",
        remarks: "",
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update attendance");
    }
  };

  const startEdit = (att) => {
    setEditingId(att.id);
    setForm({
      employeeId: att.employee?.id || "",
      date: att.date ? new Date(att.date).toISOString().split("T")[0] : "",
      checkIn: att.checkIn ? new Date(att.checkIn).toTimeString().slice(0, 5) : "",
      checkOut: att.checkOut ? new Date(att.checkOut).toTimeString().slice(0, 5) : "",
      status: att.status || "PRESENT",
      shift: att.shift || "",
      remarks: att.remarks || "",
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      checkIn: "",
      checkOut: "",
      status: "PRESENT",
      shift: "",
      remarks: "",
    });
    setShowModal(false);
  };

  const filteredAttendance = attendance.filter((att) => {
    if (selectedEmployee && att.employee?.id !== selectedEmployee) return false;
    if (selectedDate && att.date !== selectedDate) return false;
    return true;
  });

  const todayAttendance = attendance.filter(
    (att) => att.date === new Date().toISOString().split("T")[0]
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Attendance Management</h1>
          <p className="text-sm text-gray-500">Track employee check-in and check-out</p>
        </div>

        {/* Quick Check-in/Check-out */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => {
              const todayAtt = todayAttendance.find((a) => a.employee?.id === emp.id);
              const hasCheckedIn = todayAtt?.checkIn != null;
              const hasCheckedOut = todayAtt?.checkOut != null;
              return (
                <div key={emp.id} className="p-4 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.employeeId}</p>
                  <div className="flex gap-2 mt-3">
                    {!hasCheckedIn ? (
                      <button
                        onClick={() => handleCheckIn(emp.id)}
                        className="btn-primary btn-sm flex-1"
                      >
                        Check In
                      </button>
                    ) : !hasCheckedOut ? (
                      <button
                        onClick={() => handleCheckOut(emp.id)}
                        className="btn-secondary btn-sm flex-1"
                      >
                        Check Out
                      </button>
                    ) : (
                      <span className="text-sm text-black font-medium">Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            cancelEdit();
            setShowModal(true);
          }} className="btn-primary">
            + Add Attendance Record
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-3">
            <select
              className="input-field"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Attendance Records ({filteredAttendance.length})
          </h2>
          {attendance.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No attendance records yet.</p>
          ) : filteredAttendance.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No records match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((att) => (
                    <tr key={att.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        {att.employee?.name || "N/A"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {att.date ? new Date(att.date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : "-"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : "-"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {att.workingHours ? `${Math.floor(att.workingHours / 60)}h ${att.workingHours % 60}m` : "-"}
                      </td>
                      <td className="p-3">
                        <span className={`badge ${
                          att.status === "PRESENT" ? "bg-gray-100 text-gray-800" :
                          att.status === "ABSENT" ? "bg-gray-200 text-gray-900" :
                          "bg-gray-200 text-gray-800"
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => startEdit(att)}
                          className="text-black hover:text-gray-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Attendance Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Attendance" : "Add Attendance Record"}
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
                <form onSubmit={editingId ? updateAttendance : addAttendance} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      name="employeeId"
                      className="input-field"
                      value={form.employeeId}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      name="date"
                      className="input-field"
                      value={form.date}
                      onChange={handleFormChange}
                      required
                    />
                    <input
                      type="time"
                      name="checkIn"
                      className="input-field"
                      value={form.checkIn}
                      onChange={handleFormChange}
                    />
                    <input
                      type="time"
                      name="checkOut"
                      className="input-field"
                      value={form.checkOut}
                      onChange={handleFormChange}
                    />
                    <select
                      name="status"
                      className="input-field"
                      value={form.status}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="LEAVE">Leave</option>
                      <option value="HOLIDAY">Holiday</option>
                    </select>
                    <select
                      name="shift"
                      className="input-field"
                      value={form.shift}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Shift</option>
                      <option value="MORNING">Morning</option>
                      <option value="EVENING">Evening</option>
                      <option value="NIGHT">Night</option>
                    </select>
                    <textarea
                      name="remarks"
                      placeholder="Remarks (optional)"
                      className="input-field w-full md:col-span-2"
                      rows="2"
                      value={form.remarks}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update Attendance" : "Add Attendance"}
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

