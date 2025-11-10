import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function AccessDenied() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-lg text-gray-600 max-w-md">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/dashboard"
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg font-medium border-2 border-gray-900 transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}

