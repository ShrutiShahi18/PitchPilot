// src/routes/emailRoutes.js
const router = require('express').Router();
const { generateFromJD, sendWithGmail, syncReplies } = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

router.use(protect); // Protect all routes

router.post('/generate', generateFromJD);
router.post('/send', sendWithGmail);
router.post('/sync-replies', syncReplies);

module.exports = router;
