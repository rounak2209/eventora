import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Backend URL (Port 5000 check kar lena)
  const API_URL = "http://localhost:5000/api/auth";

  // 1. App start hote hi check karo ki User pehle se login hai kya?
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Yahan hum future mein /me endpoint call kar sakte hain user verify karne ke liye
          // Abhi ke liye bas token hone par user ko "logged in" maan rahe hain
          setUser({ token }); 
        }
      } catch (error) {
        console.error("Auth Check Failed", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    checkUserLoggedIn();
  }, []);

  // 2. Register Function
  const registerUser = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/register`, userData);
      
      if (res.data) {
        localStorage.setItem("token", res.data.token); // Token save karo
        setUser(res.data); // State update karo
        toast.success("Registration Successful! 🎉");
        navigate("/"); // Home page par bhej do
      }
    } catch (error) {
      console.error(error);
      // Agar backend se error message aaye toh wo dikhao, nahi toh default
      const message = error.response?.data?.message || "Registration Failed ❌";
      toast.error(message);
    }
  };

  // 3. Logout Function
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out successfully 👋");
    navigate("/login");
  };

  // 4. Login Function
  const loginUser = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/login`, userData);
      
      if (res.data) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data);
        toast.success("Welcome Back! 👋");
        navigate("/"); 
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login Failed ❌";
      toast.error(message);
    }
  };

  // value={{ user, registerUser, loginUser, logoutUser, loading }} <-- loginUser yahan add kar dena

  return (
    <AuthContext.Provider value={{ user, registerUser, loginUser,logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;