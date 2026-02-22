import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // ⏳ Pehle check karo ki loading ho rahi hai ya nahi
  // Agar page refresh hua hai toh jab tak token verify ho raha hai, ye screen dikhegi
  if (loading) {
    return (
      // 🔥 UI EXPERT FIX: Changed bg-gray-50 to dark bg-[#09090b] to prevent the "White Flashbang" on refresh.
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          {/* 🔥 Changed Blue spinner to Premium Orange Glow */}
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.2)]"></div>
          <p className="font-black text-orange-400 text-xs uppercase tracking-[0.2em] animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  // 1️⃣ SECURITY CHECK: Agar user login nahi hai
  if (!user) {
    // User ko login pe bhej do, aur 'state' mein wo path yaad rakho jahan wo ja raha tha
    // Taaki login ke baad wo wapas usi page pe pahunch sake
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2️⃣ ROLE CHECK: Agar user login toh hai, par uske paas is page ka "Adhikaar" (Role) nahi hai
  if (allowedRole && user.role !== allowedRole) {
    // Role ke hisaab se use sahi dashboard pe wapas bhej do (Redirect Loop rokne ke liye)
    const fallbackPath = user.role === 'organizer' ? '/organizer-dashboard' : 
                         user.role === 'gatekeeper' ? '/gatekeeper-dashboard' : 
                         '/student-dashboard';
                         
    console.warn(`Access Denied: You need ${allowedRole} role. Redirecting to your dashboard...`);
    return <Navigate to={fallbackPath} replace />;
  }

  // ✅ Sab kuch sahi hai? Toh jo component manga hai use render kardo!
  return children;
};

export default ProtectedRoute;