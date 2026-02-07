import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Router sabse bahar */}
      <AuthProvider> {/* Phir AuthProvider */}
        <App />
        <Toaster position="top-center" /> {/* Notifications ke liye */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)