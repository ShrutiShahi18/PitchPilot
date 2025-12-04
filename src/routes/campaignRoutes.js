const router = require('express').Router();
const { listCampaigns, createCampaign, getCampaign, updateCampaign } = require('../controllers/campaignController');
const { protect } = require('../middleware/auth');

router.use(protect); // Protect all routes

router.get('/', listCampaigns);
router.post('/', createCampaign);
router.get('/:id', getCampaign);
router.patch('/:id', updateCampaign);

module.exports = router;


