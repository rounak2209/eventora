const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const upload = require('../config/multer');  

const { 
  updateProfile, 
  getStudents, 
  findMatchingTeams, 
  sendRequest, 
  handleRequest,
  getMyRequests,
  getAvailableUsers 
} = require('../controllers/finderController');


router.get('/profile', protect, (req, res) => {
    res.status(200).json({ user: req.user });
});


router.put('/profile', protect, upload.single('profilePic'), updateProfile);



router.get('/users', protect, getAvailableUsers);
router.get('/students', protect, getStudents); 
router.get('/solo-users', protect, getStudents); 
router.get('/matching-teams', protect, findMatchingTeams); 



router.post('/invite', protect, sendRequest); 
router.post('/request', protect, sendRequest); 
router.post('/handle', protect, handleRequest); 
router.get('/my-requests', protect, getMyRequests); 

module.exports = router;