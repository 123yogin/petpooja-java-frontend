import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <h2 className="text-lg font-semibold text-black">
                {user?.role ? `${user.role} Dashboard` : "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-black">{user?.role || "User"}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-black px-4 py-2 rounded-lg transition-colors duration-200 font-medium border border-gray-300 hover:border-black"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

