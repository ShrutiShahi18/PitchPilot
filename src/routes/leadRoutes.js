const router = require('express').Router();
const { listLeads, createLead, updateLead, deleteLead } = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.use(protect); // Protect all routes

router.get('/', listLeads);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;


