const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/resume', require('./resumeRoutes'));
router.use('/emails', require('./emailRoutes'));
router.use('/leads', require('./leadRoutes'));
router.use('/campaigns', require('./campaignRoutes'));
router.use('/campaigns/:campaignId/steps', require('./sequenceRoutes'));

module.exports = router;


