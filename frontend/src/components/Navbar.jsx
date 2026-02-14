import React, { useContext } from 'react';
import { Layout, LogIn, UserPlus, Calendar, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // 👈 useNavigate add kiya
import AuthContext from '../context/AuthContext'; 

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext); 
  const navigate = useNavigate(); // 👈 Navigation ke liye hook

  // 🔥 NEW: Logo Click Logic
  const handleLogoClick = () => {
    if (!user) {
        navigate('/'); // Agar login nahi hai to Home
        return;
    }

    // Role ke hisaab se redirect
    if (user.role === 'organizer') {
        navigate('/organizer-dashboard');
    } 
    else if (user.role === 'gatekeeper') {
        navigate('/gatekeeper-dashboard');
    } 
    else {
        navigate('/dashboard'); // Student ke liye
    }
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      
      {/* 🔥 LOGO (Ab Link nahi, div hai jo click handle karega) */}
      <div 
        onClick={handleLogoClick} 
        className="flex items-center gap-2 font-bold text-2xl text-blue-600 hover:opacity-90 transition-opacity cursor-pointer"
      >
        <Layout size={28} className="text-blue-600" />
        <span className="tracking-tight text-gray-800">CampusConnect</span>
      </div>

      {/* Navigation Links (Desktop) */}
      <div className="hidden md:flex items-center gap-8 font-medium">
        
        {/* Events Link (Sirf Students ke liye sense banta hai, ya sabke liye) */}
        <Link to="/" className="text-gray-600 hover:text-blue-600 transition flex items-center gap-1">
          <Calendar size={18} /> Events
        </Link>
        
        {/* 👇 CONDITIONAL RENDERING */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-gray-700 font-semibold bg-gray-100 px-3 py-1 rounded-full">
              <User size={18} className="text-blue-600" />
              Hi, {user.name || "User"} 
            </span>

            <button 
              onClick={logoutUser}
              className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-semibold"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link 
              to="/login" 
              className="flex items-center gap-2 px-5 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              <LogIn size={18} /> Login
            </Link>

            <Link 
              to="/register" 
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <UserPlus size={18} /> Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Icon */}
      <div className="md:hidden text-gray-600">
         <button className="p-2">
            <Layout size={24} />
         </button>
      </div>
    </nav>
  );
};

export default Navbar;