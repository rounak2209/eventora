import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api"; 
import { toast } from "react-hot-toast";
import { User, Mail, Lock, UserCog, GraduationCap, Building2, Layout, Camera, Hash, BookOpen, PenTool } from "lucide-react"; // 🔥 Naye icons add kiye

const Register = () => {
  const navigate = useNavigate(); 
  const [loading, setLoading] = useState(false); 
  

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",      
    department: "",  
    year: "",
    rollNumber: "",
    skills: "",
    bio: "",
    role: "student"
  });

  const { name, email, password, gender, department, year, rollNumber, skills, bio, role } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle File Upload Preview
  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setProfilePic(file);
          setPreview(URL.createObjectURL(file));
      }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    

    if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
    }

    if (role === 'student') {

        if(!gender || !department || !year || !rollNumber) {
            toast.error("Please fill all required student fields");
            return;
        }
    }

    setLoading(true);
    const tid = toast.loading("Creating your account... Please wait ⏳");

    try {
        // Send data as FormData instead of plain JSON
        const submitData = new FormData();
        submitData.append("name", name);
        submitData.append("email", email);
        submitData.append("password", password);
        submitData.append("role", role);
        
        if (role === 'student') {
            submitData.append("gender", gender);
            submitData.append("department", department);
            submitData.append("year", year);
            submitData.append("rollNumber", rollNumber);
            submitData.append("skills", skills);
            submitData.append("bio", bio);
        }

        if (profilePic) {
            submitData.append("profilePic", profilePic);
        }

        const res = await registerUser(submitData);
        
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
    <div className="min-h-screen bg-transparent flex justify-center items-center py-12 px-4 relative overflow-hidden font-sans text-gray-100 selection:bg-orange-500/30 z-10">
      
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
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

          {/* PROFILE PIC UPLOAD */}
          <div className="flex justify-center mb-6">
              <label className="relative group w-24 h-24 rounded-[1.5rem] bg-black/40 border border-dashed border-white/20 hover:border-orange-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner cursor-pointer transition-all">
                  {preview ? (
                      <>
                          <img src={preview} alt="Profile Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={20} className="text-white" />
                          </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center text-gray-500 group-hover:text-orange-400 transition-colors">
                          <Camera size={24} />
                          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Add Photo</span>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
          </div>

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
                    autoComplete="new-password"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="••••••••"
                    required
                    style={{ WebkitBoxShadow: '0 0 0px 1000px #111113 inset', WebkitTextFillColor: 'white' }}
                />
            </div>
          </div>

          {/* CONDITIONAL RENDERING: Sirf Student ke liye extra details */}
          {role === 'student' && (
            <div className="bg-black/20 border border-white/10 p-5 rounded-[1.5rem] mt-6 space-y-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] animate-in fade-in">
                
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

                {/* Dept & Roll No */}
                <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-1/2">
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
                                <option value="" className="bg-[#111113] text-gray-500">Select Dept</option>
                                <option value="CSE" className="bg-[#111113] text-white">CSE</option>
                                <option value="ECE" className="bg-[#111113] text-white">ECE</option>
                                <option value="ME" className="bg-[#111113] text-white">ME</option>
                                <option value="CE" className="bg-[#111113] text-white">CE</option>
                                <option value="EE" className="bg-[#111113] text-white">EE</option>
                                <option value="IT" className="bg-[#111113] text-white">IT</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full sm:w-1/2">
                        <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Roll Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash size={14} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="rollNumber"
                                value={rollNumber}
                                onChange={onChange}
                                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                                placeholder="e.g. 12345"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Top Skills (Optional)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <BookOpen size={14} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="skills"
                            value={skills}
                            onChange={onChange}
                            className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                            placeholder="React, UI Design, Video Editing (comma separated)"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Short Bio (Optional)</label>
                    <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                            <PenTool size={14} className="text-gray-400" />
                        </div>
                        <textarea
                            name="bio"
                            value={bio}
                            onChange={onChange}
                            rows="2"
                            className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder-gray-500 resize-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                            placeholder="I'm a developer looking for a hackathon team..."
                        ></textarea>
                    </div>
                </div>

            </div>
          )}

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