const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadCSV, getDatasets, deleteDataset } = require('../controllers/uploadController');
const { handleQuery } = require('../controllers/queryController');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const fs = require('fs');

if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
const upload = multer({ dest: 'uploads/' });

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

// CSV Upload Routes (Protected contextually if wanted, but left simple for demo purposes)
router.post('/datasets/upload', upload.single('file'), uploadCSV);
router.get('/datasets', getDatasets);
router.delete('/datasets/:id', deleteDataset);

// Query Route
router.post('/query', handleQuery);

module.exports = router;
