import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Finder from './pages/Finder';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import GatekeeperDashboard from './pages/GatekeeperDashboard';
import Scanner from './pages/Scanner';
import Profile from './pages/Profile';


const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (token && role) {

    const dashboard = role === 'organizer' ? '/organizer-dashboard' : 
                      role === 'gatekeeper' ? '/gatekeeper-dashboard' : 
                      '/student-dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return children;
};

function App() {
  return (

    <div className="min-h-screen bg-transparent">
      
      {/* Top Navigation Bar jo har page pe rahega */}
      <Navbar />

      {/* Notifications (Toasts) ka global setup */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px' } 
        }} 
      />

      {/* ROUTING LOGIC START */}
      <Routes>

        {/*  PUBLIC ROUTES (Landing Page)           */}

        <Route path="/" element={<Home />} />
        

        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />


        {/* UNIVERSAL ROUTE (Sabke Liye)            */}

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />


        {/*  STUDENT ZONE (Sirf Students ke liye)     */}

        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRole="student">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/finder" element={
          <ProtectedRoute allowedRole="student">
            <Finder />
          </ProtectedRoute>
        } />


        {/* ORGANIZER ZONE (Sirf Organizers ke liye) */}

        <Route path="/organizer-dashboard" element={
          <ProtectedRoute allowedRole="organizer">
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/create-event" element={
          <ProtectedRoute allowedRole="organizer">
            <CreateEvent />
          </ProtectedRoute>
        } />


        {/* GATEKEEPER ZONE (Sirf Staff ke liye)    */}

        <Route path="/gatekeeper-dashboard" element={
          <ProtectedRoute allowedRole="gatekeeper">
            <GatekeeperDashboard />
          </ProtectedRoute>
        } />
        <Route path="/scan" element={
          <ProtectedRoute allowedRole="gatekeeper">
            <Scanner />
          </ProtectedRoute>
        } />





        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
}

export default App;