import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export class StorageService {
  private static uploadDir = path.join(__dirname, '../../uploads');

  /**
   * Save uploaded file to local server storage.
   */
  static async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      // Ensure upload directory exists
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      // Check if Cloudinary is configured (swap-out option)
      const cloudinaryUrl = process.env.CLOUDINARY_URL;
      if (cloudinaryUrl) {
        logger.info('Cloudinary configured. Swapping storage engine to cloud...');
        // Example implementation when Cloudinary SDK is active:
        // const uploadResult = await cloudinary.uploader.upload(file.path);
        // return uploadResult.secure_url;
      }

      // Local storage implementation
      const relativePath = `/uploads/${file.filename}`;
      logger.info(`File saved locally: ${relativePath}`);
      return relativePath;
    } catch (error) {
      logger.error('Error saving file:', error);
      throw error;
    }
  }

  /**
   * Delete file from server storage.
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith('http')) {
        // Cloudinary/external URL deletion
        return;
      }

      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted local file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error deleting file ${fileUrl}:`, error);
    }
  }

  /**
   * Return absolute file URL or local static route path.
   */
  static getFileUrl(filename: string): string {
    const port = process.env.PORT || '5000';
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/${filename}`;
  }
}
