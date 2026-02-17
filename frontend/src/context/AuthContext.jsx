import { createContext, useState, useEffect } from "react";
import api, { loginUser as apiLogin, registerUser as apiRegister } from "../api"; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Helper: JWT Token Decoder (Token ke andar se data nikalne ke liye) ---
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
      // STEP 1: Instant Login (Reload pe data turant dikhane ke liye)
      const decoded = parseJwt(token);
      
      if (decoded && decoded.exp * 1000 > Date.now()) {
          const initialUser = { 
              ...decoded, 
              _id: decoded.id || decoded._id || decoded.userId 
          };
          setUser(initialUser);
      } else {
          localStorage.clear();
          setUser(null);
          setLoading(false);
          return;
      }

      // STEP 2: Background Profile Sync (Extra details fetch karne ke liye)
      try {
        const { data } = await api.get("/finder/profile");
        
        if (data) {
            setUser((prev) => ({ 
                ...prev, 
                ...(data.user || data),
                skills: data.user?.skills || data.skills || prev?.skills || [],
                bio: data.user?.bio || data.bio || prev?.bio || ""
            }));
        }
      } catch (error) {
        console.warn("Background Sync Failed: Token data hi use ho raha hai.");
      }
    }
    
    setLoading(false);
  };

  // --- LOGIN LOGIC ---
  const loginUser = async (formData) => {
    try {
      const { data } = await apiLogin(formData);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role); 
      
      const decoded = parseJwt(data.token);
      const fullUserData = { 
          ...decoded, 
          ...(data.user || {}), 
          token: data.token,
          _id: data.user?._id || data.user?.id || decoded.id 
      };

      setUser(fullUserData);
      toast.success("Login Successful! 🎉");
      
      if (data.role === 'organizer') navigate("/organizer-dashboard");
      else if (data.role === 'gatekeeper') navigate("/gatekeeper-dashboard");
      else navigate("/student-dashboard");

    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
      throw error; 
    }
  };

  // --- REGISTER LOGIC ---
  const registerUser = async (formData) => {
    try {
      const { data } = await apiRegister(formData);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      const decoded = parseJwt(data.token);
      const fullUserData = { 
          ...decoded, 
          ...(data.user || {}), 
          token: data.token,
          _id: data.user?._id || data.user?.id || decoded.id
      };

      setUser(fullUserData);
      toast.success("Registration Successful! 🚀");
      navigate("/student-dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed");
      throw error;
    }
  };

  // --- 🛡️ PROFESSIONAL LOGOUT LOGIC (100% Fixed) ---
  const logoutUser = () => {
    // 1. Pehle localStorage saaf karo
    localStorage.clear(); 
    
    // 2. State ko null karo
    setUser(null);
    
    // 3. Success message dikhao
    toast.success("Logged out successfully");

    // 4. 🔥 PROFESSIONAL FIX: window.location use karna sabse best hai logout ke liye
    // Isse React Router ki 'Race Condition' khatam ho jati hai. 
    // Ye app ko refresh karke seedha landing page (Home) par phenk dega.
    window.location.href = "/"; 
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginUser, registerUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;