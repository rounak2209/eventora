const express = require('express');
const router = express.Router();
const { 
  getEventAnalytics, 
  emailAnalyticsReport, 
  downloadAnalyticsReport 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');



router.get('/stats', protect, getEventAnalytics);


router.post('/send-report', protect, emailAnalyticsReport);


// Usage: GET /api/analytics/download-report?eventId=12345
router.get('/download-report', protect, downloadAnalyticsReport);

module.exports = router;