const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Security Guard

// Controller se saare functions import karo
const { 
    createTeam, 
    joinTeam, 
    getMyTeam, 
    leaveTeam, 
    removeMember, 
    deleteTeam 
} = require('../controllers/teamController');

// --- ROUTES ---

// 1. Team Banana aur Join karna
router.post('/create', protect, createTeam);
router.post('/join', protect, joinTeam);

// 2. Apni Teams dekhna
router.get('/my-team', protect, getMyTeam);

// 3. Team Chhodna (Member Action) 🔥 NEW
router.post('/leave', protect, leaveTeam);

// 4. Member ko hatana (Leader Action) 🔥 NEW
router.post('/remove-member', protect, removeMember);

// 5. Team Delete karna (Leader Action) 🔥 NEW
// Note: Iske liye hum DELETE method use kar rahe hain
router.delete('/delete', protect, deleteTeam);

module.exports = router;