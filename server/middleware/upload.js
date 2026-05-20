const multer = require('multer');
const path = require('path');

// 1. Where to save files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${req.user.id}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 2. Allow PDF and Word files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',                                                        // .pdf
    'application/msword',                                                     // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word files are allowed'), false);
  }
};

// 3. Set size limit to 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;