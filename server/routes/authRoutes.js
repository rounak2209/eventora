const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 

const upload = require('../config/multer'); 

const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  addGatekeeper,
  getGatekeepers,
  updateGatekeeper, 
  deleteGatekeeper, 
  updatePassword 
} = require('../controllers/authController');


router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.put('/update-password', protect, updatePassword);

router.post('/add-gatekeeper', protect, addGatekeeper);
router.get('/gatekeepers', protect, getGatekeepers);

router.put('/gatekeeper/:id', protect, updateGatekeeper);
router.delete('/gatekeeper/:id', protect, deleteGatekeeper);

module.exports = router;