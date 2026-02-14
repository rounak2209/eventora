import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

// Pages Import
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';

// 🔥 YE DONO IMPORT KARO (Jo Missing The)
import GatekeeperDashboard from './pages/GatekeeperDashboard';
import Scanner from './pages/Scanner';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar har page par dikhega */}
      <Navbar />
      
      {/* Toast Notifications */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* Public Routes */}
        <Route path="/dashboard" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Organizer Routes */}
        <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
        <Route path="/create-event" element={<CreateEvent />} />
        
        {/* 🔥 GATEKEEPER ROUTE (Iske bina error aa raha tha) */}
        <Route path="/gatekeeper-dashboard" element={<GatekeeperDashboard />} />
        
        {/* Scanner Route */}
        <Route path="/scan" element={<Scanner />} />
      </Routes>
    </div>
  )
}

export default App;