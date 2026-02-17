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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-blue-600 text-lg">Verifying Access... 🛡️</p>
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