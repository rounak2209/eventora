const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Environment variables ke liye

const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./config/db');

// --- 1. Middlewares (SABSE PEHLE YE AAYEGA) ---
// Note: Agar ye routes ke neeche hua, toh req.body undefined milega.


const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');

// --- Middlewares ---
app.use(cors()); // Frontend se connection allow karne ke liye
app.use(express.json()); // JSON data padhne ke liye (Most Important)

// --- 2. Database Connection ---
connectDB();

// --- 3. Route Imports ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');


// --- 4. Routes Setup ---
app.use('/api/ticket', ticketRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);


// --- 5. Test Route ---
app.get('/', (req, res) => {
  res.send('Campus-Connect Server is Running! 🚀');
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});