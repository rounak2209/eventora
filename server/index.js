require('dotenv').config(); 


//console.log('ENV TEST:', process.env);

const express = require('express');
const cors = require('cors');
// Environment variables ke liye

const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./config/db');

// --- 5. Test Route ---
// --- 1. Middlewares (SABSE PEHLE YE AAYEGA) ---
// 🔥 VERY IMPORTANT: Ye lines routes se upar honi chahiye!
app.use(cors()); // Frontend se connection allow karne ke liye
app.use(express.json()); // JSON data padhne ke liye 

// --- 2. Database Connection ---
connectDB();

// --- 3. Route Imports ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const certRoutes = require('./routes/certRoutes');
const finderRoutes= require('./routes/finderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes'); // <--- Yahan Import karo

// --- 4. Routes Setup ---

app.use('/api/auth', authRoutes);
app.use('/api/ticket', ticketRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/finder', finderRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/certificate', certRoutes);
app.use('/api/analytics', analyticsRoutes); // <--- Yahan Use karo (Middleware ke baad)

app.get('/', (req, res) => {
  res.send('eventora Server is Running! 🚀');
});

// --- 6. Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});