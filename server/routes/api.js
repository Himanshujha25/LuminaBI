const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadCSV, getDatasets, getDatasetPreview, deleteDataset } = require('../controllers/uploadController');
const { handleQuery } = require('../controllers/queryController');
const { getChats, clearChats, deleteMessage } = require('../controllers/chatController');
const { register, login, getMe } = require('../controllers/authController');
const { saveDashboard, getDashboards, deleteDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const fs = require('fs');

if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

// CSV Upload Routes
router.post('/datasets/upload', protect, upload.single('file'), uploadCSV);
router.get('/datasets', protect, getDatasets);
router.get('/datasets/:id/preview', protect, getDatasetPreview);
router.delete('/datasets/:id', protect, deleteDataset);

// Chat Routes
router.get('/datasets/:datasetId/chats', protect, getChats);
router.delete('/datasets/:datasetId/chats', protect, clearChats);
router.delete('/chats/:messageId', protect, deleteMessage);

// Query Route
router.post('/query', protect, handleQuery);

// Dashboard Routes
router.post('/dashboards', protect, saveDashboard);
router.get('/dashboards', protect, getDashboards);
router.delete('/dashboards/:id', protect, deleteDashboard);

module.exports = router;
