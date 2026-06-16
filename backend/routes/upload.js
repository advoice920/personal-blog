const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { success, error } = require('../utils/response');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../frontend/public/uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return error(res, 'No file uploaded', 400);
  }
  
  // The file is in public/uploads. The frontend can access it via /uploads/filename
  const fileUrl = `/uploads/${req.file.filename}`;
  
  return success(res, { url: fileUrl }, 'File uploaded successfully', 201);
});

module.exports = router;
