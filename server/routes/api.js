const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadCSV, getDatasets, deleteDataset } = require('../controllers/uploadController');
const { handleQuery } = require('../controllers/queryController');
const { getChats, clearChats, deleteMessage } = require('../controllers/chatController');
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

// Chat Routes
router.get('/datasets/:datasetId/chats', protect, getChats);
router.delete('/datasets/:datasetId/chats', protect, clearChats);
router.delete('/chats/:messageId', protect, deleteMessage);

// Query Route
router.post('/query', protect, handleQuery);

module.exports = router;
