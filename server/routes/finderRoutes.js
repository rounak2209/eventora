const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  updateProfile, 
  findSoloUsers, 
  findMatchingTeams, 
  sendRequest, 
  handleRequest,
  getMyRequests
} = require('../controllers/finderController');

// 1. User Profile (Skills Update)
router.put('/profile', protect, updateProfile);

// 2. Search APIs
router.get('/solo-users', protect, findSoloUsers); // ?eventId=...&skill=...
router.get('/matching-teams', protect, findMatchingTeams);          // ?eventId=...&domain=...

// 3. Action APIs
router.post('/request', protect, sendRequest);     // Invite ya Join request bhejo
router.post('/handle', protect, handleRequest);    // Accept/Reject karo
router.get('/my-requests', protect, getMyRequests); // Inbox check karo

module.exports = router;