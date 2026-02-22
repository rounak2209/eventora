import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Layout, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const dropdownRef = useRef(null);

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

  // 🔥 UNIVERSAL ROUTING 
  const goToDashboard = () => {
    setIsProfileOpen(false);
    const role = user?.role || localStorage.getItem('role');
    if (role === 'organizer') navigate('/organizer-dashboard');
    else if (role === 'gatekeeper') navigate('/gatekeeper-dashboard');
    else navigate('/student-dashboard');
  };

  const goToProfile = () => {
    setIsProfileOpen(false);
    navigate('/profile'); // 🔥 Ab sab "/profile" par jayenge!
  };

  return (
    <nav className="bg-white/[0.02] backdrop-blur-2xl saturate-150 border-b border-white/10 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl group-hover:rotate-6 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Layout size={22} className="text-orange-400" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">
              EVENTORA<span className="text-orange-400">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold transition-all duration-300 ${isActive('/') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-gray-300 hover:text-white'}`}>Home</Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 pr-3 rounded-2xl transition-all active:scale-95 shadow-lg">
                  <div className="w-9 h-9 bg-gradient-to-tr from-orange-400 to-amber-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col items-start mr-1">
                    <span className="text-xs font-black text-white leading-none">{user.name?.split(' ')[0]}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#0a0a0a]/90 backdrop-blur-3xl saturate-150 border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.7)] py-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-white/5 mb-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Authenticated Account</p>
                        <p className="text-sm font-bold text-white truncate">{user.email}</p>
                    </div>

                    {/* 🔥 Dashboard aur Profile Dono Wapas Aagaye */}
                    <button onClick={goToDashboard} className="w-full flex items-center gap-4 px-5 py-3 text-sm font-bold text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all group">
                      <Layout size={18} className="group-hover:scale-110 transition-transform" /> Dashboard
                    </button>

                    <button onClick={goToProfile} className="w-full flex items-center gap-4 px-5 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all group">
                      <User size={18} className="group-hover:scale-110 transition-transform" /> My Profile
                    </button>

                    <div className="border-t border-white/5 mt-2 pt-2 px-2">
                      <button onClick={logoutUser} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-red-400/90 hover:bg-red-500/10 hover:text-red-400 transition-all rounded-xl group">
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/register" className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-orange-500/20 transition-all shadow-lg active:scale-95">Get Started</Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-300 hover:text-white transition-colors">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-3xl border-b border-white/10 p-5 animate-in slide-in-from-top duration-300">
           <div className="flex flex-col gap-4">
              <Link to="/" onClick={() => setIsOpen(false)} className={`font-bold p-2 rounded-xl ${isActive('/') ? 'text-orange-400 bg-orange-500/10' : 'text-gray-300'}`}>Home</Link>
              {user ? (
                <>
                  <button onClick={() => { goToDashboard(); setIsOpen(false); }} className="text-gray-300 font-bold p-2 text-left flex items-center gap-2 hover:text-orange-400 transition-colors"><Layout size={18}/> Dashboard</button>
                  <button onClick={() => { goToProfile(); setIsOpen(false); }} className="text-gray-300 font-bold p-2 text-left flex items-center gap-2 hover:text-orange-400 transition-colors"><User size={18}/> My Profile</button>
                  <button onClick={() => { logoutUser(); setIsOpen(false); }} className="text-red-400 font-bold p-2 text-left flex items-center gap-2 border-t border-white/5 pt-4"><LogOut size={18}/> Sign Out</button>
                </>
              ) : (
                <Link to="/register" onClick={() => setIsOpen(false)} className="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-4 rounded-2xl text-center font-black shadow-lg">Get Started</Link>
              )}
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;