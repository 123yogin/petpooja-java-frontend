import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Analytics from "./pages/Analytics";
import Tables from "./pages/Tables";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Tasks from "./pages/Tasks";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import AccountsReceivable from "./pages/AccountsReceivable";
import Outlets from "./pages/Outlets";
import AccessDenied from "./pages/AccessDenied";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerOrder from "./pages/CustomerOrder";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer/order" element={<CustomerOrder />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CASHIER", "KITCHEN", "MANAGER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/menu" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Menu />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute allowedRoles={["CASHIER", "ADMIN"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/kitchen" 
          element={
            <ProtectedRoute allowedRoles={["KITCHEN", "ADMIN"]}>
              <Kitchen />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/tables" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CASHIER"]}>
              <Tables />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute allowedRoles={["CASHIER", "ADMIN", "MANAGER"]}>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/suppliers" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/purchase-orders" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <PurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "CASHIER", "KITCHEN"]}>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CASHIER", "MANAGER"]}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "CASHIER", "KITCHEN"]}>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/leaves" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "CASHIER", "KITCHEN"]}>
              <Leaves />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/payroll" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/accounts-receivable" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "CASHIER", "MANAGER"]}>
              <AccountsReceivable />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/outlets" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Outlets />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

