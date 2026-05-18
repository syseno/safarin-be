import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Ensure upload directories exist
const publicDir = path.join(config.upload.dir, 'public');
const privateDir = path.join(config.upload.dir, 'private');

[publicDir, privateDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage config for public files (images, posters)
const publicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, publicDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Storage config for private files (SK DKM)
const privateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, privateDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'sk-dkm-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
  }
};

// File filter for documents (SK DKM)
const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed for SK DKM.'));
  }
};

export const uploadPublic = multer({
  storage: publicStorage,
  fileFilter: imageFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

export const uploadPrivate = multer({
  storage: privateStorage,
  fileFilter: documentFilter,
  limits: { fileSize: config.upload.maxFileSize },
});
