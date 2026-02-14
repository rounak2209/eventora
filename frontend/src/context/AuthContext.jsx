import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Helper: JWT Token Decoder ---
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem("token");
    
    if (token) {
      // STEP 1: TURANT Token se Data nikalo (Instant Login)
      // Isse page blank nahi hoga
      const decoded = parseJwt(token);
      
      if (decoded && decoded.exp * 1000 > Date.now()) {
          // Basic User Set kar do
          const initialUser = { 
              ...decoded, 
              _id: decoded.id || decoded._id || decoded.userId 
          };
          setUser(initialUser);
      } else {
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
      }

      // STEP 2: Background me Full Profile Data Mangwao (Skills, Bio, etc.)
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 🔥 Ye wo API hai jo 404 de rahi thi. Hum isse Try-Catch me rakhenge.
        // Agar ye chali, to user data update ho jayega.
        // Agar fail hui, to Step 1 wala user data rahega.
        const { data } = await axios.get("http://localhost:5000/api/finder/profile", config);
        
        if (data) {
            // Backend se jo data aaya use state me merge kar do
            setUser((prev) => ({ 
                ...prev, 
                ...(data.user || data), // Handle structure difference
                skills: data.user?.skills || data.skills || [],
                bio: data.user?.bio || data.bio || ""
            }));
            // console.log("Profile Synced via API"); 
        }

      } catch (error) {
        // Agar API fail ho, to chupchap raho, App crash mat karo.
        console.warn("Background Profile Sync Failed (Using Token Data Only). Check Backend Route.");
      }
    }
    
    setLoading(false);
  };

  // --- LOGIN ---
  const loginUser = async (formData) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", formData);
      console.log("Login Response:", data);
      localStorage.setItem("token", data.token);
      
      // Token Data
      const decoded = parseJwt(data.token);
      
      // API Response Data (Merge both)
      const fullUserData = { 
          ...decoded, 
          ...(data.user || {}), 
          token: data.token,
          _id: data.user?._id || data.user?.id || decoded.id 
      };

      setUser(fullUserData);
      
      toast.success("Login Successful! 🎉");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
    }
  };

  // --- REGISTER ---
  const registerUser = async (formData) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/register", formData);
      
      localStorage.setItem("token", data.token);
      
      const decoded = parseJwt(data.token);
      
      const fullUserData = { 
          ...decoded, 
          ...(data.user || {}), 
          token: data.token,
          _id: data.user?._id || data.user?.id || decoded.id
      };

      setUser(fullUserData);
      
      toast.success("Registration Successful! 🚀");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed");
    }
  };

  // --- LOGOUT ---
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, registerUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;