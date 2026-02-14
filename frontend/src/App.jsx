import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'

// 👇 Saare Pages Import Karo
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Finder from './pages/Finder'
import Dashboard from './pages/Dashboard' // ✅ New Import

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Notifications ke liye */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Pages */}
        <Route path="/finder" element={<Finder />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ New Route */}
      </Routes>
    </div>
  )
}

export default App