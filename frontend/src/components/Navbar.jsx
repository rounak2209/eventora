import React from 'react';
import { Layout, LogIn, UserPlus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom'; // 👈 Navigation ke liye zaruri hai

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo: Click karne par Home jayega */}
      <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary hover:opacity-90 transition-opacity">
        <Layout size={28} className="text-primary" />
        <span className="tracking-tight text-gray-800">CampusConnect</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8 font-medium">
        <Link to="/" className="text-gray-600 hover:text-primary transition flex items-center gap-1">
          <Calendar size={18} /> Events
        </Link>
        
        <div className="flex gap-3">
          {/* Login Link */}
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-5 py-2 text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
          >
            <LogIn size={18} /> Login
          </Link>

          {/* Register Link */}
          <Link 
            to="/register" 
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all font-semibold"
          >
            <UserPlus size={18} /> Register
          </Link>
        </div>
      </div>

      {/* Mobile Menu Icon (Sirf design ke liye abhi) */}
      <div className="md:hidden text-gray-600">
         <button className="p-2">
            <Layout size={24} />
         </button>
      </div>
    </nav>
  );
};

export default Navbar;