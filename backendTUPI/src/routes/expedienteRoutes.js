const { Router } = require('express');
const multer = require('multer');
const { analizarExpediente } = require('../controllers/expedienteController.js');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Límite de 20 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Solo se permiten archivos PDF.'));
    }
  },
});

router.post('/analizar', upload.single('expediente'), analizarExpediente);

module.exports = router;