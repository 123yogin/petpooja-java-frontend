import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <Navbar />
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link to="/menu" className="bg-blue-500 text-white p-6 rounded hover:bg-blue-600 text-center">
          Menu Management
        </Link>
        <Link to="/tables" className="bg-teal-500 text-white p-6 rounded hover:bg-teal-600 text-center">
          Tables
        </Link>
        <Link to="/orders" className="bg-green-500 text-white p-6 rounded hover:bg-green-600 text-center">
          Orders
        </Link>
        <Link to="/kitchen" className="bg-orange-500 text-white p-6 rounded hover:bg-orange-600 text-center">
          Kitchen
        </Link>
        <Link to="/analytics" className="bg-purple-500 text-white p-6 rounded hover:bg-purple-600 text-center">
          Analytics
        </Link>
      </div>
    </div>
  );
}

