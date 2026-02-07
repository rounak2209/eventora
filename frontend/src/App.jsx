import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast' // 🔔 Notification ke liye
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar sabse upar */}
      <Navbar />
      
      {/* 🔔 Notifications ka setup (Popups yahi dikhenge) */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}

export default App