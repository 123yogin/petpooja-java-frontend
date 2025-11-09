import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
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
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </AuthProvider>
  );
}

export default App;

