import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api"; // 👈 New Import (api.js se)
import { toast } from "react-hot-toast";

const Login = () => {
  const { loginUser: contextLogin } = useContext(AuthContext); 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔥 OLD: axios.post("http://localhost:5000/api/auth/login", formData);
      // ✅ NEW: Direct function call from api.js
      const res = await loginUser(formData);
      
      // 1. Token & Data Save karo
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role); 
      
      toast.success(res.data.message || "Login Successful");

      // 2. Role Based Redirect Logic 🔀
      if (res.data.role === 'organizer') {
        navigate('/organizer-dashboard');
      } else if (res.data.role === 'gatekeeper') {
        navigate('/gatekeeper-dashboard');
      } else {
        navigate('/student-dashboard');
      }
      
      // Context/State refresh karne ke liye reload
      window.location.reload(); 

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Login 🔐</h2>
        
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Email ID"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="******"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-500 font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;