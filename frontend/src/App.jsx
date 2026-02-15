import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

// Pages Import
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import GatekeeperDashboard from './pages/GatekeeperDashboard';
import Scanner from './pages/Scanner';
import Finder from './pages/Finder';
import Dashboard from './pages/Dashboard'; // ✅ Ye Student Dashboard hai

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Notifications ke liye */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* ======================================================== */}
        {/* 🏠 PUBLIC ROUTES                                         */}
        {/* ======================================================== */}
        
        {/* Agar tum chahte ho ki 'npm run dev' karte hi dashboard khule, 
            to niche wali line uncomment kar do: */}
        {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}

        {/* Abhi ke liye standard setting: Root '/' pe Home page */}
        <Route path="/" element={<Home />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* ======================================================== */}
        {/* 🎓 STUDENT ROUTES                                        */}
        {/* ======================================================== */}
        {/* ✅ Ye fix ho gaya: Ab /dashboard par Student Dashboard hi dikhega */}
        <Route path="/student-dashboard" element={<Dashboard />} />
        <Route path="/finder" element={<Finder />} />

        {/* ======================================================== */}
        {/* 🛠️ ORGANIZER ROUTES                                      */}
        {/* ======================================================== */}
        <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
        <Route path="/create-event" element={<CreateEvent />} />
        
        {/* ======================================================== */}
        {/* 🛡️ GATEKEEPER ROUTES                                     */}
        {/* ======================================================== */}
        <Route path="/gatekeeper-dashboard" element={<GatekeeperDashboard />} />
        <Route path="/scan" element={<Scanner />} />

        {/* 404 - Agar koi galat link dale to wapas Home bhej do */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
}

export default App;