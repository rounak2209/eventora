import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Layout, Menu, X, User, LogOut, Home as HomeIcon, ChevronDown, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [isOpen, setIsOpen] = useState(false); // Mobile menu ke liye
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Profile Dropdown ke liye
  const dropdownRef = useRef(null);

  // Bahar click karne par dropdown band karne ke liye logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const goToDashboard = () => {
    setIsProfileOpen(false);
    const role = user?.role || localStorage.getItem('role');
    if (role === 'organizer') navigate('/organizer-dashboard');
    else if (role === 'gatekeeper') navigate('/gatekeeper-dashboard');
    else navigate('/student-dashboard');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* 🚀 Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-6 transition-all shadow-lg shadow-indigo-100">
              <Layout size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">
              EVENTORA<span className="text-indigo-600">.</span>
            </span>
          </Link>

          {/* 💻 Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-bold transition-colors ${isActive('/') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Home
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* 👤 Professional Profile Trigger */}
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 p-1.5 pr-3 rounded-2xl transition-all active:scale-95"
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col items-start mr-1">
                    <span className="text-xs font-black text-slate-800 leading-none">{user.name?.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 📝 Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Account</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                    </div>

                    <button 
                      onClick={goToDashboard}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <Layout size={18} /> Dashboard
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      <User size={18} /> My Profile
                    </button>

                    <div className="border-t border-slate-50 mt-2 pt-2">
                      <button 
                        onClick={logoutUser}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/register" 
                className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* 📱 Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;