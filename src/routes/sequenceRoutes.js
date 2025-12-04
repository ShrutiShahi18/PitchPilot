const router = require('express').Router({ mergeParams: true });
const { listSteps, createStep, scheduleFollowUp } = require('../controllers/sequenceController');

router.get('/', listSteps);
router.post('/', createStep);
router.post('/:stepId/schedule', scheduleFollowUp);

module.exports = router;


