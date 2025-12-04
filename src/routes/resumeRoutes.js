const router = require('express').Router();
const { uploadResume, getResume, downloadResume, deleteResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // Protect all routes

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getResume);
router.get('/download', downloadResume);
router.delete('/', deleteResume);

module.exports = router;

