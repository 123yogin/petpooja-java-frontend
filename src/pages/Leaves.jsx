import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";

export default function Leaves() {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
    remarks: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const loadLeaves = async () => {
    try {
      const res = await API.get("/leaves");
      setLeaves(res.data);
    } catch (err) {
      toast.error("Failed to load leaves");
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
    loadLeaves();
    loadEmployees();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const addLeave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        employee: { id: form.employeeId },
      };
      await API.post("/leaves", payload);
      toast.success("Leave request submitted!");
      loadLeaves();
      setForm({
        employeeId: "",
        leaveType: "CASUAL",
        startDate: "",
        endDate: "",
        reason: "",
        remarks: "",
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit leave request");
    }
  };

  const approveLeave = async (id) => {
    try {
      await API.put(`/leaves/${id}/approve?approvedById=${user.id}`);
      toast.success("Leave approved!");
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve leave");
    }
  };

  const rejectLeave = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason) {
      try {
        await API.put(`/leaves/${id}/reject?approvedById=${user.id}&rejectionReason=${encodeURIComponent(reason)}`);
        toast.success("Leave rejected!");
        loadLeaves();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to reject leave");
      }
    }
  };

  const cancelLeave = async (id) => {
    if (window.confirm("Are you sure you want to cancel this leave?")) {
      try {
        await API.put(`/leaves/${id}/cancel`);
        toast.success("Leave cancelled!");
        loadLeaves();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to cancel leave");
      }
    }
  };

  const deleteLeave = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave?")) {
      try {
        await API.delete(`/leaves/${id}`);
        toast.success("Leave deleted!");
        loadLeaves();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete leave");
      }
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter === "ALL") return true;
    return leave.status === statusFilter;
  });

  const canApprove = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Leave Management</h1>
          <p className="text-sm text-gray-500">Manage employee leave requests and approvals</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            setForm({
              employeeId: "",
              leaveType: "CASUAL",
              startDate: "",
              endDate: "",
              reason: "",
              remarks: "",
            });
            setShowModal(true);
          }} className="btn-primary">
            + Request Leave
          </button>
        </div>

        {/* Leaves List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">All Leaves ({filteredLeaves.length})</h2>
            <select
              className="input-field text-sm w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {leaves.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No leave requests yet.</p>
          ) : filteredLeaves.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No leaves match your filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {leave.employee?.name || "N/A"}
                        </h3>
                        <span className={`badge ${
                          leave.status === "APPROVED" ? "bg-gray-100 text-gray-800" :
                          leave.status === "REJECTED" ? "bg-gray-200 text-gray-900" :
                          leave.status === "PENDING" ? "bg-gray-200 text-gray-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {leave.status}
                        </span>
                        <span className="badge bg-gray-100 text-gray-800">{leave.leaveType}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Period:</span>{" "}
                          {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "N/A"} -{" "}
                          {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Days:</span> {leave.numberOfDays || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Reason:</span> {leave.reason || "N/A"}
                        </p>
                        {leave.approvedBy && (
                          <p>
                            <span className="font-medium">Approved by:</span> {leave.approvedBy.username}
                            {leave.approvedAt && ` on ${new Date(leave.approvedAt).toLocaleDateString()}`}
                          </p>
                        )}
                        {leave.rejectionReason && (
                          <p className="text-gray-700">
                            <span className="font-medium">Rejection Reason:</span> {leave.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {leave.status === "PENDING" && canApprove && (
                        <>
                          <button
                            onClick={() => approveLeave(leave.id)}
                            className="btn-primary btn-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectLeave(leave.id)}
                            className="btn-danger btn-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status === "PENDING" && (
                        <button
                          onClick={() => cancelLeave(leave.id)}
                          className="btn-outline btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => deleteLeave(leave.id)}
                        className="btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Leave Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Request Leave</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setForm({
                        employeeId: "",
                        leaveType: "CASUAL",
                        startDate: "",
                        endDate: "",
                        reason: "",
                        remarks: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={addLeave} className="space-y-4">
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
                    <select
                      name="leaveType"
                      className="input-field"
                      value={form.leaveType}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="SICK">Sick Leave</option>
                      <option value="CASUAL">Casual Leave</option>
                      <option value="EARNED">Earned Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                      <option value="MATERNITY">Maternity Leave</option>
                      <option value="PATERNITY">Paternity Leave</option>
                    </select>
                    <input
                      type="date"
                      name="startDate"
                      className="input-field"
                      value={form.startDate}
                      onChange={handleFormChange}
                      required
                    />
                    <input
                      type="date"
                      name="endDate"
                      className="input-field"
                      value={form.endDate}
                      onChange={handleFormChange}
                      required
                    />
                    <textarea
                      name="reason"
                      placeholder="Reason for leave *"
                      className="input-field w-full md:col-span-2"
                      rows="3"
                      value={form.reason}
                      onChange={handleFormChange}
                      required
                    />
                    <textarea
                      name="remarks"
                      placeholder="Remarks (optional)"
                      className="input-field w-full md:col-span-2"
                      rows="3"
                      value={form.remarks}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      Submit Leave Request
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setForm({
                          employeeId: "",
                          leaveType: "CASUAL",
                          startDate: "",
                          endDate: "",
                          reason: "",
                          remarks: "",
                        });
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

