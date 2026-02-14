import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to check active link
  const isActive = (path) => location.pathname === path ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-4xl font-black text-blue-600 tracking-tighter">
              Eventora<span className="text-gray-900">.</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={`px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/')}`}>
              Home
            </Link>
            
            {user ? (
              <>
                <Link to="/finder" className={`px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/finder')}`}>
                  Find Teammates
                </Link>
                <Link to="/dashboard" className={`px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/dashboard')}`}>
                  Dashboard
                </Link>
                <button 
                  onClick={logoutUser}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/login')}`}>
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</Link>
            {user ? (
              <>
                <Link to="/finder" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Find Teammates</Link>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Dashboard</Link>
                <button onClick={logoutUser} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Login</Link>
                <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;