const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // 👈 Import protect
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  addGatekeeper,
  getGatekeepers,
  updateGatekeeper, // 🔥 Naya Import: Edit karne ke liye
  deleteGatekeeper, // 🔥 Naya Import: Delete karne ke liye
  updatePassword // 🔥 Function Import
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 🔥 NEW ROUTE: Profile se password change karne ke liye (Protect middleware ke saath)
router.put('/update-password', protect, updatePassword);

// 🔥 NEW ROUTE: Sirf Organizer access karega
router.post('/add-gatekeeper', protect, addGatekeeper);
router.get('/gatekeepers', protect, getGatekeepers);

// 🔥 NAYE ROUTES: Gatekeeper ko update aur delete karne ke liye
router.put('/gatekeeper/:id', protect, updateGatekeeper);
router.delete('/gatekeeper/:id', protect, deleteGatekeeper);

module.exports = router;