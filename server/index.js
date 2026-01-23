const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Environment variables ke liye

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors()); // Frontend se connection allow karne ke liye
app.use(express.json()); // JSON data padhne ke liye

// --- Database Connection (MongoDB) ---
// Note: 'campus-connect' database ka naam hai
mongoose.connect('mongodb://127.0.0.1:27017/campus-connect')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- Test Route ---
app.get('/', (req, res) => {
  res.send('Campus-Connect Server is Running! 🚀');
});

// --- Future Routes Imports (Iske liye baad mein routes folder banayenge) ---
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});