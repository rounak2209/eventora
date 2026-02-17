import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api"; // 👈 New Import (api.js se)
import { toast } from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate(); 
  const [loading, setLoading] = useState(false); // Loading state add kiya for better UX

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",      
    department: "",  
    year: "",
    role: "student"  // ✅ Default role student
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

    // ✅ Logic Update: Agar Student hai tabhi ye fields check karo
    if (role === 'student') {
        if(!gender || !department || !year) {
            toast.error("Please fill all fields");
            return;
        }
    }

    setLoading(true);

    try {
        // 🔥 OLD: context.registerUser(formData);
        // ✅ NEW: Direct API call from api.js
        const res = await registerUser(formData);
        
        toast.success(res.data.message || "Registration Successful! Please Login.");
        navigate('/login'); // Success hone par Login page par bhejo

    } catch (error) {
        console.error("Registration Error:", error);
        toast.error(error.response?.data?.message || "Registration Failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">
          Join Us! 🚀
        </h2>

        <form onSubmit={onSubmit}>
          
          {/* ✅ Role Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">I am a</label>
            <select
                name="role"
                value={role}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
            </select>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full Name"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="College Email ID"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="******"
              required
            />
          </div>

          {/* ✅ Conditional Rendering: Agar Student hai tabhi ye dikhao */}
          {role === 'student' && (
            <>
                {/* Gender & Year (Side by Side) */}
                <div className="flex gap-4 mb-4">
                    <div className="w-1/2">
                    <label className="block text-gray-700 font-bold mb-2">Gender</label>
                    <select
                        name="gender"
                        value={gender}
                        onChange={onChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                    >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    </div>

                    <div className="w-1/2">
                    <label className="block text-gray-700 font-bold mb-2">Year</label>
                    <select
                        name="year"
                        value={year}
                        onChange={onChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                    >
                        <option value="">Select</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                    </select>
                    </div>
                </div>

                {/* Department */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">Department</label>
                    <select
                    name="department"
                    value={department}
                    onChange={onChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                    >
                    <option value="">Select Department</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">Mechanical</option>
                    <option value="CE">Civil</option>
                    <option value="EE">Electrical</option>
                    <option value="IT">IT</option>
                    </select>
                </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg disabled:bg-blue-400"
          >
            {loading ? "Registering..." : "Register Now"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;