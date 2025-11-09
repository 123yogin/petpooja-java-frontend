import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex justify-between bg-gray-900 text-white p-4">
      <h2 className="font-bold">Petpooja Clone</h2>
      <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded">Logout</button>
    </div>
  );
}

