const express = require('express');
const router = express.Router();
const { 
    createEvent, 
    getEvents, 
    getGatekeeperEvents, 
    joinEvent,
    updateEvent, 
    deleteEvent,
    getOrganizerEvents 
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../config/multer'); 


router.get('/', getEvents);


router.get('/my-events', protect, getOrganizerEvents);


router.post('/', protect, upload.single('banner'), createEvent);


router.put('/:id', protect, upload.single('banner'), updateEvent); 
router.delete('/:id', protect, deleteEvent); 

router.post('/join', protect, joinEvent); 


router.get('/gatekeeper-view', protect, getGatekeeperEvents);

module.exports = router;