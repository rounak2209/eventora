const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  updateProfile, 
  getStudents, 
  findMatchingTeams, 
  sendRequest, 
  handleRequest,
  getMyRequests,
  getAvailableUsers // 👈 Ye naya function import karna hoga controller se
} = require('../controllers/finderController');

// ==========================================
// 1. USER PROFILE APIs
// ==========================================
// 🔥 NEW: Ye AuthContext ke 404 Error ko fix karega.
// Kyunki protect middleware already user ko fetch kar leta hai, hum seedha wahi bhej denge.
router.get('/profile', protect, (req, res) => {
    res.status(200).json({ user: req.user });
});

// Update Profile (Bio/Skills)
router.put('/profile', protect, updateProfile);


// ==========================================
// 2. SEARCH APIs (Team Finder Page)
// ==========================================
// 🔥 NEW: Team Finder Page isko call kar raha hai (List of all students)
router.get('/users', protect, getAvailableUsers);

// Frontend 'Finder' page isko call karta hai (Legacy/Specific Filtering)
router.get('/students', protect, getStudents); 

// Legacy route (Backup)
router.get('/solo-users', protect, getStudents); 

// Team matching logic
router.get('/matching-teams', protect, findMatchingTeams); 


// ==========================================
// 3. ACTION APIs (Invites & Requests)
// ==========================================
// 🔥 NEW: 'Invite' button isko call kar raha hai
router.post('/invite', protect, sendRequest); 

// Join Request (Existing)
router.post('/request', protect, sendRequest); 

// Accept/Reject Request
router.post('/handle', protect, handleRequest); 

// Inbox/Notifications
router.get('/my-requests', protect, getMyRequests); 

module.exports = router;