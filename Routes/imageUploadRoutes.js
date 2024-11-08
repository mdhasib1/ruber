const express = require('express');
const router = express.Router();
const imageController = require('../Controllers/imageControllers');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/upload', upload.single('file'), imageController.upload);

module.exports = router;
