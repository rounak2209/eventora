require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// --- 1. INITIALIZE APP & DATABASE ---
const app = express();
connectDB();

// --- 2. MIDDLEWARES ---
// Professional CORS: Frontend (Vite) se connection pakka karne ke liye
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite ka default port
    credentials: true
}));

app.use(express.json()); // JSON data padhne ke liye (Request Body)
app.use(express.urlencoded({ extended: true })); // Form data handle karne ke liye

// --- 3. ROUTE IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const certRoutes = require('./routes/certRoutes');
const finderRoutes = require('./routes/finderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// --- 4. ROUTES SETUP ---
// Ye saare wahi prefixes hain jo tumhari api.js (Frontend) call kar rahi hai
app.use('/api/auth', authRoutes);
app.use('/api/ticket', ticketRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/finder', finderRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/certificate', certRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('Eventora Server is Running! 🚀');
});

// --- 5. GLOBAL ERROR HANDLER (Extra Safety) ---
// Isse agar server pe koi crash aaye to frontend ko pata chal jayega
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});