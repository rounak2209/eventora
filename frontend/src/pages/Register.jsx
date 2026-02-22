import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api"; 
import { toast } from "react-hot-toast";
import { User, Mail, Lock, UserCog, GraduationCap, Building2, Layout } from "lucide-react"; 

const Register = () => {
  const navigate = useNavigate(); 
  const [loading, setLoading] = useState(false); 

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",      
    department: "",  
    year: "",
    role: "student"  
  });

  const { name, email, password, gender, department, year, role } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
    }

    if (role === 'student') {
        if(!gender || !department || !year) {
            toast.error("Please fill all fields");
            return;
        }
    }

    setLoading(true);
    const tid = toast.loading("Creating your account... Please wait ⏳");

    try {
        const res = await registerUser(formData);
        
        toast.success(res.data.message || "Registration Successful! Please Login.", { id: tid });
        navigate('/login'); 

    } catch (error) {
        console.error("Registration Error:", error);
        toast.error(error.response?.data?.message || "Registration Failed", { id: tid });
    } finally {
        setLoading(false);
    }
  };

  return (
    // 🔥 ROOT: bg-transparent let the background shine 100%
    <div className="min-h-screen bg-transparent flex justify-center items-center py-12 px-4 relative overflow-hidden font-sans text-gray-100 selection:bg-orange-500/30 z-10">
      
      {/* 🔥 REMOVED THE bg-black/20 LAYER. Only subtle glows left! */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* 🔥 CRYSTAL CLEAR GLASS CARD: Changed from black/50 to white/5 (Matches Dashboard perfectly) */}
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Logo / Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Layout size={28} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                Join <span className="text-orange-400">Eventora.</span>
            </h2>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Create your premium account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          
          {/* Role Selection */}
          <div>
            <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">I am registering as</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserCog size={18} className="text-orange-400/80" />
                </div>
                <select
                    name="role"
                    value={role}
                    onChange={onChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="student" className="bg-[#111113] text-white">Student / Participant</option>
                    <option value="organizer" className="bg-[#111113] text-white">Event Organizer</option>
                </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={onChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="John Doe"
                    required
                    style={{ WebkitBoxShadow: '0 0 0px 1000px #111113 inset', WebkitTextFillColor: 'white' }}
                />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                </div>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="college@domain.edu"
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
                    name="password"
                    value={password}
                    onChange={onChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="••••••••"
                    required
                    style={{ WebkitBoxShadow: '0 0 0px 1000px #111113 inset', WebkitTextFillColor: 'white' }}
                />
            </div>
          </div>

          {/* Conditional Rendering for Students */}
          {role === 'student' && (
            <div className="bg-black/20 border border-white/10 p-5 rounded-[1.5rem] mt-6 space-y-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                
                {/* Gender & Year */}
                <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Gender</label>
                        <select
                            name="gender"
                            value={gender}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
                            required
                        >
                            <option value="" className="bg-[#111113] text-gray-500">Select</option>
                            <option value="Male" className="bg-[#111113] text-white">Male</option>
                            <option value="Female" className="bg-[#111113] text-white">Female</option>
                            <option value="Other" className="bg-[#111113] text-white">Other</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-1/2">
                        <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Academic Year</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <GraduationCap size={14} className="text-gray-400" />
                            </div>
                            <select
                                name="year"
                                value={year}
                                onChange={onChange}
                                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="" className="bg-[#111113] text-gray-500">Select Year</option>
                                <option value="1st" className="bg-[#111113] text-white">1st Year</option>
                                <option value="2nd" className="bg-[#111113] text-white">2nd Year</option>
                                <option value="3rd" className="bg-[#111113] text-white">3rd Year</option>
                                <option value="4th" className="bg-[#111113] text-white">4th Year</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Department */}
                <div>
                    <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Department</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 size={14} className="text-gray-400" />
                        </div>
                        <select
                            name="department"
                            value={department}
                            onChange={onChange}
                            className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
                            required
                        >
                            <option value="" className="bg-[#111113] text-gray-500">Select Department</option>
                            <option value="CSE" className="bg-[#111113] text-white">CSE</option>
                            <option value="ECE" className="bg-[#111113] text-white">ECE</option>
                            <option value="ME" className="bg-[#111113] text-white">ME</option>
                            <option value="CE" className="bg-[#111113] text-white">CE</option>
                            <option value="EE" className="bg-[#111113] text-white">EE</option>
                            <option value="IT" className="bg-[#111113] text-white">IT</option>
                        </select>
                    </div>
                </div>
            </div>
          )}

          {/* Premium Transparent Amber Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-black text-xs uppercase tracking-[0.2em] py-4 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 mt-6 ${loading ? 'opacity-70 cursor-not-allowed scale-[0.98]' : 'hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95'}`}
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
                    Processing...
                </>
            ) : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-400 font-black hover:text-orange-300 transition-colors ml-1 drop-shadow-sm">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;