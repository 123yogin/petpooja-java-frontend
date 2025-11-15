import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: "Smart Billing Engine",
      description: "Fast POS with keyboard shortcuts, split bills, and PDF invoice generation"
    },
    {
      title: "KOT & Kitchen Control",
      description: "Live KOT routing to different kitchens via WebSocket real-time updates"
    },
    {
      title: "Table & Section Management",
      description: "Table layout view, running orders, merge and split functionality"
    },
    {
      title: "Customer QR Ordering",
      description: "QR code-based table ordering for seamless dine-in customer experience"
    },
    {
      title: "Inventory & Wastage Tracking",
      description: "Low-stock alerts, recipe-level consumption, and auto-deduction on billing"
    },
    {
      title: "Multi-Outlet Analytics",
      description: "Outlet comparison, day-wise and hour-wise sales analytics"
    },
    {
      title: "HR & Workforce Management",
      description: "Employee management, attendance tracking, leave management, and payroll"
    },
    {
      title: "Supplier & Procurement",
      description: "Supplier management and purchase order tracking"
    },
    {
      title: "Role-Based Access Control",
      description: "Granular permissions for staff, managers, and owners with audit logs"
    },
    {
      title: "Real-Time Dashboard",
      description: "Live sales summaries, charts, and reports with instant updates"
    },
    {
      title: "Accounts Receivable",
      description: "Track customer payments and outstanding invoices"
    },
    {
      title: "Task Management",
      description: "Assign and track tasks across teams and departments"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">RS</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">RestroSuite</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="text-gray-700 hover:text-black font-medium transition-colors text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight tracking-tight">
              Restaurant Management
              <span className="block text-gray-600 mt-2">
                Made Simple
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              All-in-one POS system for billing, KOT, inventory, multi-outlet control, and real-time analytics
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-semibold text-lg border-2 border-black transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Powerful features designed to help you run your restaurant more efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl bg-white border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 bg-black rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-black mb-6">
                A Complete Restaurant Operating System
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                RestroSuite is a full-stack restaurant management platform inspired by leading solutions like Petpooja. Built for modern restaurants, cafés, QSR chains, and fine dining establishments.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Handle everything from counter billing and dine-in tables to online orders, KOT printing, menu management, inventory tracking, and multi-outlet reporting—all in one unified system.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                  <span className="text-gray-700">Cloud-based POS system</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                  <span className="text-gray-700">Real-time WebSocket updates</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                  <span className="text-gray-700">Multi-outlet franchise support</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                  <span className="text-gray-700">Role-based access control</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-black mr-4"></div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Billing & Payments</h3>
                    <p className="text-gray-600 text-sm">Streamlined billing with PDF invoices and multiple payment options</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-black mr-4"></div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Kitchen Display</h3>
                    <p className="text-gray-600 text-sm">Real-time KOT routing and order status updates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-black mr-4"></div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Inventory Management</h3>
                    <p className="text-gray-600 text-sm">Track ingredients, low stock alerts, and auto-deduction</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-black mr-4"></div>
                  <div>
                    <h3 className="font-semibold text-black mb-1">Analytics & Reports</h3>
                    <p className="text-gray-600 text-sm">Comprehensive sales summaries and outlet performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Powered by enterprise-grade technologies for reliability and performance
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              "Java 17",
              "Spring Boot",
              "PostgreSQL",
              "React 18",
              "WebSocket",
              "Tailwind CSS"
            ].map((tech, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:border-black transition-all duration-200"
              >
                <div className="text-2xl font-bold text-black mb-2">{tech.split(' ')[0]}</div>
                <div className="text-xs text-gray-600">{tech}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Join restaurants already using RestroSuite to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RS</span>
                </div>
                <span className="text-xl font-semibold text-black">RestroSuite</span>
              </div>
              <p className="text-sm text-gray-600">
                Restaurant POS & Management System
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/login" className="hover:text-black transition-colors">POS</Link></li>
                <li><Link to="/login" className="hover:text-black transition-colors">KOT</Link></li>
                <li><Link to="/login" className="hover:text-black transition-colors">Inventory</Link></li>
                <li><Link to="/login" className="hover:text-black transition-colors">Reporting</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/" className="hover:text-black transition-colors">About</Link></li>
                <li><Link to="/login" className="hover:text-black transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4">Get Started</h3>
              <Link
                to="/register"
                className="inline-block bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Request Demo
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 text-center">
              © 2025 RestroSuite. Inspired by platforms like Petpooja. Built for modern restaurants.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
