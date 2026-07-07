import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importCsvHandler } from '../controllers/import.controller';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter to restrict to CSV files only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = 
    file.mimetype === 'text/csv' || 
    file.mimetype === 'application/vnd.ms-excel' || 
    file.mimetype === 'text/x-csv' || 
    file.mimetype === 'text/plain'; // some OS upload CSVs as text/plain

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only CSV files are allowed!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  }
});

/**
 * @openapi
 * /api/import:
 *   post:
 *     summary: Import CSV leads using AI mapping
 *     description: Accepts a CSV file, streams it, and standardizes columns to the target CRM schema using Gemini or OpenAI. Normalizes phones, dates, and status fields.
 *     tags:
 *       - Leads Import
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *                 description: The CSV file. Max 20MB.
 *     responses:
 *       200:
 *         description: Mapped leads returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalRows:
 *                   type: integer
 *                 imported:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 failedBatches:
 *                   type: integer
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing file or validation size error
 *       500:
 *         description: AI mapping or internal server error
 */
// POST /api/import - accepts single file in the 'csv' field
router.post('/import', (req, res, next) => {
  upload.single('csv')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds 20MB limit' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, importCsvHandler);

export default router;
