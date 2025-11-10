import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    employeeId: "",
    department: "",
    designation: "",
    shift: "",
    basicSalary: "",
    allowances: "",
    deductions: "",
    joinDate: "",
    dateOfBirth: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const loadEmployees = async () => {
    try {
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0.0,
        allowances: form.allowances ? parseFloat(form.allowances) : 0.0,
        deductions: form.deductions ? parseFloat(form.deductions) : 0.0,
        joinDate: form.joinDate || new Date().toISOString().split("T")[0],
        dateOfBirth: form.dateOfBirth || null,
      };
      await API.post("/employees", payload);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        employeeId: "",
        department: "",
        designation: "",
        shift: "",
        basicSalary: "",
        allowances: "",
        deductions: "",
        joinDate: "",
        dateOfBirth: "",
        gender: "",
        emergencyContact: "",
        emergencyPhone: "",
        isActive: true,
      });
      setShowModal(false);
      toast.success("Employee added!");
      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  const updateEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0.0,
        allowances: form.allowances ? parseFloat(form.allowances) : 0.0,
        deductions: form.deductions ? parseFloat(form.deductions) : 0.0,
        dateOfBirth: form.dateOfBirth || null,
      };
      await API.put(`/employees/${editingId}`, payload);
      toast.success("Employee updated!");
      loadEmployees();
      setEditingId(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        employeeId: "",
        department: "",
        designation: "",
        shift: "",
        basicSalary: "",
        allowances: "",
        deductions: "",
        joinDate: "",
        dateOfBirth: "",
        gender: "",
        emergencyContact: "",
        emergencyPhone: "",
        isActive: true,
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee");
    }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await API.delete(`/employees/${id}`);
        toast.success("Employee deleted!");
        loadEmployees();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete employee");
      }
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      pincode: employee.pincode || "",
      employeeId: employee.employeeId || "",
      department: employee.department || "",
      designation: employee.designation || "",
      shift: employee.shift || "",
      basicSalary: employee.basicSalary?.toString() || "",
      allowances: employee.allowances?.toString() || "",
      deductions: employee.deductions?.toString() || "",
      joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split("T")[0] : "",
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split("T")[0] : "",
      gender: employee.gender || "",
      emergencyContact: employee.emergencyContact || "",
      emergencyPhone: employee.emergencyPhone || "",
      isActive: employee.isActive !== undefined ? employee.isActive : true,
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      employeeId: "",
      department: "",
      designation: "",
      shift: "",
      basicSalary: "",
      allowances: "",
      deductions: "",
      joinDate: "",
      dateOfBirth: "",
      gender: "",
      emergencyContact: "",
      emergencyPhone: "",
      isActive: true,
    });
    setShowModal(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActiveFilter =
      filterActive === "all" ||
      (filterActive === "true" && emp.isActive) ||
      (filterActive === "false" && !emp.isActive);

    const matchesDepartmentFilter =
      filterDepartment === "all" || emp.department === filterDepartment;

    return matchesSearch && matchesActiveFilter && matchesDepartmentFilter;
  });

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Employee Management</h1>
          <p className="text-sm text-gray-500">Manage your restaurant staff and employees</p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => {
            cancelEdit();
            setShowModal(true);
          }} className="btn-primary">
            + Add New Employee
          </button>
        </div>

        {/* Add/Edit Employee Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Employee" : "Add New Employee"}
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
                <form onSubmit={editingId ? updateEmployee : addEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                className="input-field"
                value={form.name}
                onChange={handleFormChange}
                required
              />
              <input
                type="text"
                name="employeeId"
                placeholder="Employee ID *"
                className="input-field"
                value={form.employeeId}
                onChange={handleFormChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="input-field"
                value={form.email}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                className="input-field"
                value={form.phone}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="department"
                placeholder="Department (e.g., KITCHEN, SERVICE)"
                className="input-field"
                value={form.department}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="designation"
                placeholder="Designation (e.g., Chef, Waiter)"
                className="input-field"
                value={form.designation}
                onChange={handleFormChange}
              />
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
                <option value="GENERAL">General</option>
              </select>
              <input
                type="number"
                name="basicSalary"
                placeholder="Basic Salary (₹) *"
                step="0.01"
                min="0"
                className="input-field"
                value={form.basicSalary}
                onChange={handleFormChange}
                required
              />
              <input
                type="number"
                name="allowances"
                placeholder="Allowances (₹)"
                step="0.01"
                min="0"
                className="input-field"
                value={form.allowances}
                onChange={handleFormChange}
              />
              <input
                type="number"
                name="deductions"
                placeholder="Deductions (₹)"
                step="0.01"
                min="0"
                className="input-field"
                value={form.deductions}
                onChange={handleFormChange}
              />
              <input
                type="date"
                name="joinDate"
                placeholder="Join Date *"
                className="input-field"
                value={form.joinDate}
                onChange={handleFormChange}
                required
              />
              <input
                type="date"
                name="dateOfBirth"
                placeholder="Date of Birth"
                className="input-field"
                value={form.dateOfBirth}
                onChange={handleFormChange}
              />
              <select
                name="gender"
                className="input-field"
                value={form.gender}
                onChange={handleFormChange}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                type="text"
                name="address"
                placeholder="Address"
                className="input-field"
                value={form.address}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                className="input-field"
                value={form.city}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                className="input-field"
                value={form.state}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                className="input-field"
                value={form.pincode}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="emergencyContact"
                placeholder="Emergency Contact Name"
                className="input-field"
                value={form.emergencyContact}
                onChange={handleFormChange}
              />
              <input
                type="text"
                name="emergencyPhone"
                placeholder="Emergency Contact Phone"
                className="input-field"
                value={form.emergencyPhone}
                onChange={handleFormChange}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Is Active</span>
              </label>
            </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingId ? "Update Employee" : "Add Employee"}
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

        {/* Employees List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">All Employees ({filteredEmployees.length})</h2>
            <div className="flex gap-2">
              <select
                className="input-field text-sm w-32"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <select
                className="input-field text-sm w-32"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search employees..."
                className="input-field w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No employees added yet.</p>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No employees match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{employee.name}</td>
                      <td className="p-3 text-gray-700">{employee.employeeId}</td>
                      <td className="p-3 text-gray-700">{employee.department || "N/A"}</td>
                      <td className="p-3 text-gray-700">{employee.designation || "N/A"}</td>
                      <td className="p-3 text-gray-700">₹{employee.basicSalary?.toFixed(2) || "0.00"}</td>
                      <td className="p-3">
                        <span
                          className={`badge ${
                            employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => startEdit(employee)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
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

