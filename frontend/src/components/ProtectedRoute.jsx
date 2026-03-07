import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();


  if (loading) {
    return (

      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">

          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.2)]"></div>
          <p className="font-black text-orange-400 text-xs uppercase tracking-[0.2em] animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }


  if (!user) {

    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  if (allowedRole && user.role !== allowedRole) {

    const fallbackPath = user.role === 'organizer' ? '/organizer-dashboard' : 
                         user.role === 'gatekeeper' ? '/gatekeeper-dashboard' : 
                         '/student-dashboard';
                         
    console.warn(`Access Denied: You need ${allowedRole} role. Redirecting to your dashboard...`);
    return <Navigate to={fallbackPath} replace />;
  }


  return children;
};

export default ProtectedRoute;