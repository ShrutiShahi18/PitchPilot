const router = require('express').Router();
const { signup, signin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', protect, getMe);

module.exports = router;

