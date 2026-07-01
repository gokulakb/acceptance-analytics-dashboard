const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/overview', analyticsController.getOverview);
router.get('/stages', analyticsController.getStageBreakdown);
router.get('/statuses', analyticsController.getStatusBreakdown);
router.get('/timeline', analyticsController.getTimeline);
router.get('/activity', analyticsController.getRecentActivity);
router.get('/quality', analyticsController.getDataQuality);

module.exports = router;
