const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');


const { 
    createTeam, 
    joinTeam, 
    getMyTeam, 
    leaveTeam, 
    removeMember, 
    deleteTeam 
} = require('../controllers/teamController');


router.post('/create', protect, createTeam);
router.post('/join', protect, joinTeam);


router.get('/my-team', protect, getMyTeam);


router.post('/leave', protect, leaveTeam);


router.post('/remove-member', protect, removeMember);


router.delete('/delete', protect, deleteTeam);

module.exports = router;