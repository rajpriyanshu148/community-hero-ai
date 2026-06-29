import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { env } from '../config/env';

// ============================================================
// Ensure upload directory exists
// ============================================================
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Subdirectories for organization
const subdirs = ['images', 'videos', 'documents'];
subdirs.forEach((subdir) => {
  const fullPath = path.join(uploadDir, subdir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ============================================================
// Storage Engine
// ============================================================
const diskStorage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const mimeType = file.mimetype;
    let subdir = 'documents';

    if (mimeType.startsWith('image/')) {
      subdir = 'images';
    } else if (mimeType.startsWith('video/')) {
      subdir = 'videos';
    }

    cb(null, path.join(uploadDir, subdir));
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ============================================================
// File Filter
// ============================================================
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Audio (for voice reports)
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed: ${file.mimetype}. Allowed types: images, videos, audio.`
      )
    );
  }
};

// ============================================================
// Multer Configurations
// ============================================================

/**
 * Main issue media uploader - up to 5 files, 10MB each
 */
export const issueUpload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5,
  },
});

/**
 * Single file uploader for AI analysis
 */
export const singleUpload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Avatar uploader - images only, 2MB
 */
export const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(uploadDir, 'images'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars.'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

/**
 * Memory storage for files that will be processed in-memory (e.g., sent to Gemini)
 */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 1,
  },
});

export default issueUpload;
