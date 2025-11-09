import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadPayrolls = async () => {
    try {
      const res = await API.get("/payroll");
      setPayrolls(res.data);
    } catch (err) {
      toast.error("Failed to load payrolls");
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
    loadPayrolls();
    loadEmployees();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const generatePayroll = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/payroll/generate?employeeId=${form.employeeId}&month=${form.month}&year=${form.year}`);
      toast.success("Payroll generated successfully!");
      loadPayrolls();
      setForm({
        employeeId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate payroll");
    }
  };

  const markAsPaid = async (id) => {
    try {
      await API.put(`/payroll/${id}/mark-paid`);
      toast.success("Payroll marked as paid!");
      loadPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update payroll");
    }
  };

  const filteredPayrolls = payrolls.filter((payroll) => {
    if (selectedMonth && payroll.month !== selectedMonth) return false;
    if (selectedYear && payroll.year !== selectedYear) return false;
    return true;
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Payroll Management</h1>
          <p className="text-sm text-gray-500">Generate and manage employee payroll</p>
        </div>

        {/* Generate Payroll Form */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Payroll</h2>
          <form onSubmit={generatePayroll} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                name="month"
                className="input-field"
                value={form.month}
                onChange={handleFormChange}
                required
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                name="year"
                className="input-field"
                value={form.year}
                onChange={handleFormChange}
                required
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Generate Payroll
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-3">
            <select
              className="input-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              <option value="">All Months</option>
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payroll List */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Payroll Records ({filteredPayrolls.length})
          </h2>
          {payrolls.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No payroll records yet.</p>
          ) : filteredPayrolls.length === 0 ? (
            <p className="text-gray-500 text-center py-12 text-sm">No records match your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredPayrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payroll.employee?.name || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {months[payroll.month - 1]} {payroll.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{payroll.netSalary?.toFixed(2) || "0.00"}
                      </p>
                      <span className={`badge ${
                        payroll.status === "PAID" ? "bg-green-100 text-green-800" :
                        payroll.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {payroll.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Earnings</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Basic Salary:</span>
                          <span className="font-medium">₹{payroll.basicSalary?.toFixed(2) || "0.00"}</span>
                        </div>
                        {payroll.houseRentAllowance > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">HRA:</span>
                            <span className="font-medium">₹{payroll.houseRentAllowance?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.transportAllowance > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transport:</span>
                            <span className="font-medium">₹{payroll.transportAllowance?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.medicalAllowance > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Medical:</span>
                            <span className="font-medium">₹{payroll.medicalAllowance?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.overtimePay > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Overtime:</span>
                            <span className="font-medium">₹{payroll.overtimePay?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.bonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bonus:</span>
                            <span className="font-medium">₹{payroll.bonus?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Total Earnings:</span>
                          <span className="font-bold">₹{payroll.totalEarnings?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Deductions</h4>
                      <div className="space-y-1 text-sm">
                        {payroll.providentFund > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Provident Fund:</span>
                            <span className="font-medium">₹{payroll.providentFund?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.professionalTax > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Professional Tax:</span>
                            <span className="font-medium">₹{payroll.professionalTax?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.incomeTax > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Income Tax:</span>
                            <span className="font-medium">₹{payroll.incomeTax?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        {payroll.otherDeductions > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Other Deductions:</span>
                            <span className="font-medium">₹{payroll.otherDeductions?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Total Deductions:</span>
                          <span className="font-bold">₹{payroll.totalDeductions?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Days Present:</span>
                      <span className="font-medium ml-2">{payroll.daysPresent || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Absent:</span>
                      <span className="font-medium ml-2">{payroll.daysAbsent || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Leave:</span>
                      <span className="font-medium ml-2">{payroll.daysLeave || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Overtime Days:</span>
                      <span className="font-medium ml-2">{payroll.daysOvertime || 0}</span>
                    </div>
                  </div>

                  {payroll.paymentDate && (
                    <p className="text-sm text-gray-600 mb-3">
                      Payment Date: {new Date(payroll.paymentDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {payroll.status === "PENDING" && (
                      <button
                        onClick={() => markAsPaid(payroll.id)}
                        className="btn-primary btn-sm"
                      >
                        Mark as Paid
                      </button>
                    )}
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

