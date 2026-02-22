import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Mail, Lock, Layout, LogIn } from "lucide-react"; // 🔥 Added premium icons

const Login = () => {
  // 🔥 Context se loginUser nikal liya
  const { loginUser } = useContext(AuthContext); 
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Bas ye ek line! 
      // API call, token save, Toast message, aur Role-based Redirect...
      // Ye sab tumhare AuthContext ke andar jo loginUser banaya h, wo khud kar lega.
      await loginUser(formData);
    } catch (error) {
      console.error(error);
      setLoading(false); // Agar error aaye (wrong password), toh button wapas theek ho jaye
    }
  };

  return (
    // 🔥 ROOT: bg-transparent let the background shine 100%
    <div className="min-h-screen bg-transparent flex justify-center items-center py-12 px-4 relative overflow-hidden font-sans text-gray-100 selection:bg-orange-500/30 z-10">
      
      {/* Background Subtle Overlays (To make the glass pop) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* 🔥 CRYSTAL CLEAR GLASS CARD: Matches Register exactly */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Logo / Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Layout size={28} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                Welcome <span className="text-orange-400">Back.</span>
            </h2>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Sign in to your account</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                </div>
                {/* 🔥 EXPERT FIX: Added autofill hack here too */}
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                  placeholder="college@domain.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{ WebkitBoxShadow: '0 0 0px 1000px #111113 inset', WebkitTextFillColor: 'white' }}
                />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  style={{ WebkitBoxShadow: '0 0 0px 1000px #111113 inset', WebkitTextFillColor: 'white' }}
                />
            </div>
          </div>

          {/* Premium Transparent Amber Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-black text-xs uppercase tracking-[0.2em] py-4 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 mt-8 ${loading ? 'opacity-70 cursor-not-allowed scale-[0.98]' : 'hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95'}`}
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
                    Authenticating...
                </>
            ) : (
                <>
                    <LogIn size={18} />
                    Secure Login
                </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
          Don't have an account?{" "}
          <Link to="/register" className="text-orange-400 font-black hover:text-orange-300 transition-colors ml-1 drop-shadow-sm">
            Create One
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;