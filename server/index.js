const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Environment variables ke liye

const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./config/db');



const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

// --- Middlewares ---
app.use(cors()); // Frontend se connection allow karne ke liye
app.use(express.json()); // JSON data padhne ke liye

// --- Database Connection (Abhi ke liye hata diya hai) ---
connectDB();
// Jab baad mein MongoDB connect karna ho, tab wapas add kar lenge.



// --- Test Route ---
app.get('/', (req, res) => {
  res.send('Campus-Connect Server is Running! (Without DB) 🚀');
});

// --- Auth Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/registrations', registrationRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});