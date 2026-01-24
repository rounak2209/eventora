const express = require('express');
const router = express.Router();
const { createTeam, joinTeam,getMyTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware'); // Security

// Team banane aur join karne ke liye Login chahiye
router.post('/create', protect, createTeam);
router.post('/join', protect, joinTeam);
router.get('/my-team', protect, getMyTeam);


module.exports = router;