import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Layout, Menu, X, User, LogOut, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // 🔥 SMART REDIRECT LOGIC
  const handleNavigation = (path) => {
    setIsOpen(false); // Mobile menu band karo
    if (path) {
      navigate(path);
      return;
    }
    
    // Agar path nahi diya, to Role check karo (Dashboard logic)
    if (!user) {
        navigate('/');
        return;
    }
    // Role Checks
    if (user.role === 'organizer') navigate('/organizer-dashboard');
    else if (user.role === 'gatekeeper') navigate('/gatekeeper-dashboard');
    else navigate('/student-dashboard'); // Student Logic
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* 🔥 LOGO (Clickable & Smart) */}
          <div 
            onClick={() => handleNavigation('/')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Layout size={28} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-4xl font-bold text-gray-800 tracking-tight">
              <span className="text-light blue-600">Eventora.</span>
            </span>
          </div>

          {/* 💻 DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* ❌ Events aur Find Team yahan se hata diye gaye hain */}
            
            {user ? (
              <>
                {/* Dynamic Dashboard Button */}
                <button 
                  onClick={() => handleNavigation()} // Calls smart redirect
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-gray-50`}
                >
                  <Layout size={18} /> Dashboard
                </button>

                {/* User Badge */}
                <div className="flex items-center gap-2 text-gray-700 font-semibold bg-blue-50 px-4 py-2 rounded-full">
                  <User size={18} className="text-blue-600" />
                  <span className="capitalize">{user.name || "User"}</span>
                </div>

                <button 
                  onClick={logoutUser}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              // Guest Users
              <div className="flex items-center gap-3">
                <Link to="/login" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/register" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm">
                  <UserPlus size={18} /> Register
                </Link>
              </div>
            )}
          </div>

          {/* 📱 MOBILE MENU BUTTON */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            
            {/* ❌ Mobile Menu se bhi Events aur Find Team hata diya */}
            
            {user ? (
              <>
                {/* Mobile Dashboard Link */}
                <button 
                  onClick={() => handleNavigation()} 
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  📊 Dashboard
                </button>

                <div className="border-t border-gray-100 my-2 pt-2">
                  <div className="px-3 py-2 text-sm text-gray-500">Signed in as <span className="font-bold text-gray-800">{user.name}</span></div>
                  <button onClick={logoutUser} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 flex flex-col gap-2 px-3">
                <Link onClick={() => setIsOpen(false)} to="/login" className="w-full text-center block px-3 py-2 rounded-lg border border-gray-300 font-medium text-gray-700">
                  Login
                </Link>
                <Link onClick={() => setIsOpen(false)} to="/register" className="w-full text-center block px-3 py-2 rounded-lg bg-blue-600 font-medium text-white">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;